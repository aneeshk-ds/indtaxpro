/**
 * rsuCalculator.js
 *
 * The #1 AI failure in Indian tax apps: treating RSU vesting and RSU sale
 * as the same event. They are two separate taxable events with different treatment.
 *
 * VESTING EVENT (Income):
 *   - Taxed as "Salary" (perquisite) at fair market value on vest date
 *   - TDS should have been deducted by employer (check Form 16)
 *   - Cost basis for capital gains = FMV on vest date (SBI TT rate)
 *
 * SALE EVENT (Capital Gains) - foreign shares are taxed under Section 112,
 * NOT under 112A/111A (those are for Indian listed equity only):
 *   - Sale price - Cost basis (FMV on vest date) = capital gain
 *   - Holding period runs from the VEST date, not the grant date
 *   - Held > 24 months from vesting: LTCG at 12.5% flat, no indexation, NO 1.25L exemption
 *   - Held <= 24 months from vesting: STCG added to total income, taxed at the SLAB rate
 */

import {
  FOREIGN_SHARE_LTCG_HOLDING_MONTHS,
  FOREIGN_SHARE_LTCG_RATE,
  FOREIGN_SHARE_LTCG_EXEMPTION,
} from './taxRates';

/**
 * @param {Array<Object>} rsuLots - Each lot:
 *   {
 *     id: string,
 *     ticker: string,
 *     sharesVested: number,
 *     vestDate: string,        // ISO date "YYYY-MM-DD"
 *     fmvOnVestUSD: number,    // FMV per share on vest date (USD)
 *     sbiRateOnVest: number,   // SBI TT rate on vest date (INR/USD)
 *     sharesSold: number,      // How many shares from this lot were sold (0 if not sold)
 *     saleDate: string|null,   // ISO date of sale
 *     salePriceUSD: number,    // Price per share at sale (USD)
 *     sbiRateOnSale: number,   // SBI TT rate on sale date (INR/USD)
 *     tdsDeductedINR: number,  // TDS deducted by employer on vest (from Form 16)
 *   }
 *
 * @returns {Object} breakdown of perquisite income and capital gains
 */
export function calculateRSUTax(rsuLots) {
  let totalPerquisiteINR = 0;
  let totalTDSCredited = 0;
  let totalLTCG = 0;
  let totalSTCG = 0;
  const lotBreakdowns = [];
  const issues = [];

  for (const lot of rsuLots) {
    const fmvINR = lot.fmvOnVestUSD * lot.sbiRateOnVest;
    const perquisiteINR = lot.sharesVested * fmvINR;
    totalPerquisiteINR += perquisiteINR;
    totalTDSCredited += lot.tdsDeductedINR || 0;

    let cgINR = 0;
    let cgType = null;
    let holdingMonths = null;
    let holdingDays = null;

    if (lot.sharesSold > 0 && lot.saleDate) {
      const vestDate = parseISODate(lot.vestDate);
      const saleDate = parseISODate(lot.saleDate);
      holdingMonths = monthsBetween(vestDate, saleDate);
      holdingDays = daysBetween(vestDate, saleDate);

      const costBasisPerShare = fmvINR;                         // FMV on vest = cost basis
      const salePriceINR = lot.salePriceUSD * lot.sbiRateOnSale;
      const gainPerShare = salePriceINR - costBasisPerShare;
      cgINR = gainPerShare * lot.sharesSold;

      // Foreign shares: long term only if held for MORE THAN 24 months (day-accurate).
      if (isHeldLongerThanMonths(vestDate, saleDate, FOREIGN_SHARE_LTCG_HOLDING_MONTHS)) {
        cgType = 'LTCG';
        totalLTCG += cgINR;
      } else {
        cgType = 'STCG';
        totalSTCG += cgINR;
      }

      // Flag if user is using grant date instead of vest date
      if (lot.grantDate && lot.grantDate !== lot.vestDate) {
        const grantDate = parseISODate(lot.grantDate);
        const grantMonths = monthsBetween(grantDate, saleDate);
        const grantLong = isHeldLongerThanMonths(grantDate, saleDate, FOREIGN_SHARE_LTCG_HOLDING_MONTHS);
        const vestLong = isHeldLongerThanMonths(vestDate, saleDate, FOREIGN_SHARE_LTCG_HOLDING_MONTHS);
        if (grantLong && !vestLong) {
          issues.push({
            lotId: lot.id,
            code: 'GRANT_VS_VEST_DATE',
            severity: 'high',
            title: `Lot ${lot.ticker}: Holding period must be from VEST date, not grant date`,
            detail: `From grant: ${grantMonths} months (long term). From vest: ${holdingMonths} months (short term). `
                  + 'For foreign shares the clock starts at vesting and needs more than 24 months for LTCG. '
                  + 'Using the grant date will misstate the gain type and can trigger a notice.',
          });
        }
      }
    }

    // Flag if TDS looks insufficient (rough check: TDS < 30% of perquisite)
    if (lot.tdsDeductedINR > 0 && lot.tdsDeductedINR < perquisiteINR * 0.25) {
      issues.push({
        lotId: lot.id,
        code: 'LOW_TDS',
        severity: 'medium',
        title: `Lot ${lot.ticker}: TDS appears low relative to perquisite value`,
        detail: `Perquisite: INR ${Math.round(perquisiteINR / 1000)}K | TDS: INR ${Math.round(lot.tdsDeductedINR / 1000)}K. `
              + 'Verify Form 16 Part B for correct perquisite value.',
      });
    }

    lotBreakdowns.push({
      id: lot.id,
      ticker: lot.ticker,
      vestDate: lot.vestDate,
      sharesVested: lot.sharesVested,
      fmvINR: Math.round(fmvINR),
      perquisiteINR: Math.round(perquisiteINR),
      tdsDeducted: lot.tdsDeductedINR || 0,
      sale: lot.sharesSold > 0 ? {
        sharesSold: lot.sharesSold,
        saleDate: lot.saleDate,
        holdingMonths,
        holdingDays,
        cgType,
        cgINR: Math.round(cgINR),
        // LTCG: 12.5% flat (Sec 112). STCG: taxed at slab, so no fixed per-lot rate here.
        taxRate: cgType === 'LTCG' ? FOREIGN_SHARE_LTCG_RATE : null,
        taxINR: cgType === 'LTCG'
          ? Math.round(Math.max(0, cgINR) * FOREIGN_SHARE_LTCG_RATE)
          : null,
        taxNote: cgType === 'STCG' ? 'Short-term: added to total income, taxed at your slab rate' : null,
      } : null,
    });
  }

  // Foreign shares are taxed under Section 112: the 112A INR 1.25L LTCG exemption does
  // NOT apply, and short-term gains are taxed at the slab rate (not a flat 20%).
  const ltcgExemption = FOREIGN_SHARE_LTCG_EXEMPTION; // 0 for foreign shares
  const taxableLTCG = Math.max(0, totalLTCG - ltcgExemption);
  const ltcgTax = Math.round(taxableLTCG * FOREIGN_SHARE_LTCG_RATE);
  const taxableSTCG = Math.max(0, totalSTCG);
  const stcgTax = null; // STCG is taxed at the user's slab rate, not a fixed figure here

  if (taxableSTCG > 0) {
    issues.push({
      code: 'STCG_AT_SLAB',
      severity: 'low',
      title: 'Short-term gain on US shares is taxed at your slab rate',
      detail: `Short-term capital gain of INR ${Math.round(taxableSTCG).toLocaleString('en-IN')} is added to your `
            + 'total income and taxed at the slab rate. The flat 20% (Sec 111A) is only for Indian listed equity.',
    });
  }

  return {
    summary: {
      totalPerquisiteINR: Math.round(totalPerquisiteINR),
      totalTDSCredited: Math.round(totalTDSCredited),
      tdsGap: Math.round(totalPerquisiteINR * 0.30 - totalTDSCredited), // rough check at 30%
      totalLTCG: Math.round(totalLTCG),
      totalSTCG: Math.round(totalSTCG),
      ltcgExemptionUsed: 0, // 112A exemption does not apply to foreign shares
      taxableLTCG: Math.round(taxableLTCG),
      taxableSTCG: Math.round(taxableSTCG),
      ltcgTax,
      stcgTax,                  // null: short-term gain is taxed at the slab rate
      stcgTaxedAtSlab: true,
      totalCGTax: ltcgTax,      // LTCG tax only; STCG flows into slab tax
    },
    lotBreakdowns,
    issues,
    scheduleRequirements: {
      salarySchedule: totalPerquisiteINR > 0,
      scheduleCG: totalLTCG > 0 || totalSTCG > 0,
      form67Needed: false, // RSU perquisite is not foreign income for DTAA purposes
      note: 'RSU vesting income goes in Salary schedule. RSU sale goes in Schedule CG. These are separate.',
    },
  };
}

// Parse "YYYY-MM-DD" via explicit components so it is treated as a LOCAL date.
// (new Date("YYYY-MM-DD") parses as UTC and can roll back a day in UTC-negative zones.)
function parseISODate(s) {
  if (s instanceof Date) return s;
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function monthsBetween(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

function daysBetween(d1, d2) {
  return Math.round((d2 - d1) / 86400000);
}

// True if held for STRICTLY MORE THAN `months` months (day-of-month aware).
// Indian tax: long-term needs holding for MORE THAN the threshold, not at least.
function isHeldLongerThanMonths(acqDate, saleDate, months) {
  const threshold = new Date(acqDate.getFullYear(), acqDate.getMonth() + months, acqDate.getDate());
  return saleDate > threshold;
}

/**
 * ESPP (Employee Stock Purchase Plan) calculator
 * ESPP discount at purchase = perquisite income
 * Subsequent gain/loss = capital gains from ESPP purchase date
 */
export function calculateESPPTax(esppLots) {
  const breakdowns = [];
  let totalDiscount = 0;
  let totalCG = 0;

  for (const lot of esppLots) {
    // Discount = (FMV on purchase date - purchase price) * shares
    const fmvINR = lot.fmvOnPurchaseUSD * lot.sbiRateOnPurchase;
    const purchasePriceINR = lot.purchasePriceUSD * lot.sbiRateOnPurchase;
    const discountPerShare = fmvINR - purchasePriceINR;
    const discountTotal = discountPerShare * lot.sharesPurchased;
    totalDiscount += discountTotal;

    let cgINR = 0;
    let cgType = null;
    let holdingMonths = null;

    if (lot.sharesSold > 0 && lot.saleDate) {
      const purchaseDate = parseISODate(lot.purchaseDate);
      const saleDate = parseISODate(lot.saleDate);
      holdingMonths = monthsBetween(purchaseDate, saleDate);
      const salePriceINR = lot.salePriceUSD * lot.sbiRateOnSale;
      // Cost basis for CG = FMV on purchase date (not the discounted price)
      cgINR = (salePriceINR - fmvINR) * lot.sharesSold;
      // Foreign shares: long term only if held more than 24 months (Section 112)
      cgType = isHeldLongerThanMonths(purchaseDate, saleDate, FOREIGN_SHARE_LTCG_HOLDING_MONTHS) ? 'LTCG' : 'STCG';
      totalCG += cgINR;
    }

    breakdowns.push({
      ticker: lot.ticker,
      purchaseDate: lot.purchaseDate,
      discountINR: Math.round(discountTotal),
      cgINR: cgINR ? Math.round(cgINR) : null,
      cgType,
      holdingMonths,
    });
  }

  return { totalDiscountINR: Math.round(totalDiscount), totalCGINR: Math.round(totalCG), breakdowns };
}
