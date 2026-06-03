/**
 * taxRates.js
 * Indian tax rates, slabs, and constants for FY 2025-26 / AY 2026-27
 * Slabs reflect Budget 2025 (presented Feb 1, 2025)
 */

// New Regime slabs - FY 2025-26 (Budget 2025 revised)
// 0-4L: 0 | 4-8L: 5% | 8-12L: 10% | 12-16L: 15% | 16-20L: 20% | 20-24L: 25% | >24L: 30%
export const NEW_REGIME_SLABS = [
  { upTo: 400000,   rate: 0    },
  { upTo: 800000,   rate: 0.05 },
  { upTo: 1200000,  rate: 0.10 },
  { upTo: 1600000,  rate: 0.15 },
  { upTo: 2000000,  rate: 0.20 },
  { upTo: 2400000,  rate: 0.25 },
  { upTo: Infinity, rate: 0.30 },
];

// New Regime slabs - FY 2024-25 (for AY 2025-26 comparisons)
export const NEW_REGIME_SLABS_FY2425 = [
  { upTo: 300000,   rate: 0    },
  { upTo: 700000,   rate: 0.05 },
  { upTo: 1000000,  rate: 0.10 },
  { upTo: 1200000,  rate: 0.15 },
  { upTo: 1500000,  rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// Old Regime slabs (below 60 yrs) - unchanged
export const OLD_REGIME_SLABS = [
  { upTo: 250000,   rate: 0    },
  { upTo: 500000,   rate: 0.05 },
  { upTo: 1000000,  rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// Surcharge rates - OLD regime (top band 37% above 5 Cr)
export const SURCHARGE = [
  { above: 50000000, rate: 0.37 },  // > 5 Cr
  { above: 20000000, rate: 0.25 },  // > 2 Cr
  { above: 10000000, rate: 0.15 },  // > 1 Cr
  { above: 5000000,  rate: 0.10 },  // > 50 L
  { above: 0,        rate: 0    },
];

// Surcharge rates - NEW regime. The 37% band was removed; surcharge is CAPPED at 25%.
export const SURCHARGE_NEW_REGIME = [
  { above: 20000000, rate: 0.25 },  // > 2 Cr (cap)
  { above: 10000000, rate: 0.15 },  // > 1 Cr
  { above: 5000000,  rate: 0.10 },  // > 50 L
  { above: 0,        rate: 0    },
];

// Health & Education Cess
export const CESS_RATE = 0.04;

// DTAA India-USA withholding rates
export const DTAA_USA = {
  // India-US DTAA Article 10: dividends paid to an INDIVIDUAL are taxed at 25%.
  // The 15% rate applies ONLY where the beneficial owner is a company holding
  // >= 10% of the voting stock. Retail RSU/ESPP holders are individuals -> 25%.
  dividendMax:  0.25,  // treaty cap for individuals
  dividendDTAA: 0.25,  // applicable treaty rate for individual portfolio investors
  dividendCorporate10pc: 0.15, // only if beneficial owner is a company holding >=10%
  interestMax:  0.15,
  royaltiesMax: 0.15,
};

// Black Money Act flat penalty per omission
export const BLACK_MONEY_PENALTY = 1000000; // INR 10 Lakh

// CA review threshold for US assets
export const US_ASSET_THRESHOLD_USD = 10000;
export const USD_TO_INR_APPROX      = 84.5;

// Capital gains - INDIAN listed equity (STT paid), Sections 112A / 111A.
// NOTE: these do NOT apply to foreign (e.g. US-listed) shares. See FOREIGN_* below.
export const EQUITY_LTCG_HOLDING_MONTHS = 12;     // Indian listed equity: >12 months = LT
export const LTCG_RATE_EQUITY           = 0.125;  // 12.5% u/s 112A (Budget 2024)
export const STCG_RATE_EQUITY           = 0.20;   // 20% u/s 111A
export const LTCG_EXEMPTION_EQUITY      = 125000; // INR 1.25 L exempt u/s 112A

// Capital gains - FOREIGN shares (US RSUs / ESPP / directly held US stocks).
// Foreign shares are not listed on a recognised Indian exchange, so 112A / 111A do
// NOT apply. They are taxed under Section 112:
//   Long term  : held MORE THAN 24 months -> 12.5% flat, no indexation, NO 1.25L exemption
//   Short term : held 24 months or less   -> added to income, taxed at the SLAB rate
export const FOREIGN_SHARE_LTCG_HOLDING_MONTHS = 24;
export const FOREIGN_SHARE_LTCG_RATE           = 0.125;
export const FOREIGN_SHARE_LTCG_EXEMPTION      = 0;     // 112A exemption does not extend to foreign shares
export const FOREIGN_SHARE_STCG_AT_SLAB        = true;  // no flat 20%; STCG taxed at slab

// Standard deductions
export const STANDARD_DEDUCTION_NEW = 75000;   // FY2025-26 (up from 50K in FY2024-25)
export const STANDARD_DEDUCTION_OLD = 50000;

// Old regime deduction limits
export const DEDUCTION_80C_LIMIT  = 150000;
export const DEDUCTION_80D_SELF   = 25000;
export const DEDUCTION_80D_SENIOR = 50000;
export const NPS_80CCD1B          = 50000;
export const HOME_LOAN_INTEREST_LIMIT = 200000; // Sec 24(b)

/**
 * Calculate slab tax before surcharge and cess
 */
export function calcSlabTax(income, slabs) {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upTo) - prev;
    tax += taxable * slab.rate;
    prev = slab.upTo;
  }
  return Math.round(tax);
}

/**
 * Apply surcharge on base tax.
 * @param {'old'|'new'} regime - the new regime caps surcharge at 25% (no 37% band).
 * Note: marginal relief on surcharge is not modelled (documented limitation).
 */
export function calcSurcharge(income, baseTax, regime = 'old') {
  const table = regime === 'new' ? SURCHARGE_NEW_REGIME : SURCHARGE;
  for (const s of table) {
    if (income > s.above) return Math.round(baseTax * s.rate);
  }
  return 0;
}

/**
 * Full tax computation: slab + surcharge + cess.
 * @param {'old'|'new'} regime - controls the surcharge cap (default 'old').
 */
export function calcFinalTax(income, slabs, regime = 'old') {
  const base      = calcSlabTax(income, slabs);
  const surcharge = calcSurcharge(income, base, regime);
  const cess      = Math.round((base + surcharge) * CESS_RATE);
  return { base, surcharge, cess, total: base + surcharge + cess };
}

/**
 * New Regime 87A rebate - FY2025-26
 * Full rebate (up to INR 60,000) if taxable income <= INR 12L
 * Result: effective zero tax for income up to 12L
 */
export function applyNewRegimeRebate(income, tax) {
  if (income <= 1200000) return 0;
  return tax;
}
