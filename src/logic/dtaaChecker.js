/**
 * dtaaChecker.js
 *
 * DTAA India-USA compliance checker.
 * Key rules:
 *   - Form 67 (or Form 44 in 2026) MUST be filed BEFORE the ITR
 *   - US withholds 25% on dividends for individuals; treaty rate is 25% (15% only for companies holding >=10%)
 *   - FTC = Foreign Tax Credit. If Form 67 is not filed in time, FTC is forfeited
 *   - CA digital signature required for credits above threshold (2026 rule)
 */

import { DTAA_USA } from './taxRates';

const FORM_67_THRESHOLD_INR = 500000; // above this, CA signature required (2026 rule)

/**
 * @param {Object} input
 * @param {boolean} input.form67Filed          - Was Form 67/44 filed before the ITR?
 * @param {boolean} input.form67BeforeITR      - Filed BEFORE the ITR deadline?
 * @param {number} input.usDividendIncome_INR  - Total US dividend income converted to INR
 * @param {number} input.usWithheldTax_INR     - Tax withheld by US (from 1042-S or broker statement)
 * @param {number} input.usWithheldTax_USD     - Same, in USD (for rate verification)
 * @param {number} input.usDividendIncome_USD  - Dividend income in USD
 * @param {boolean} input.caSignatureObtained  - CA digital signature obtained (if credit > threshold)
 * @param {string} input.exchangeRateSource    - "SBI_TT" | "custom" | "unknown"
 * @param {number|null} input.customRate       - If custom, the rate used
 *
 * @returns {Object} DTAA compliance result
 */
export function checkDTAA(input) {
  const issues = [];
  const checks = [];

  // --- Check 1: Form 67 filed at all ---
  if (!input.form67Filed) {
    issues.push({
      code: 'FORM_67_NOT_FILED',
      severity: 'critical',
      title: 'Form 67 not filed',
      detail: 'Without Form 67, the IT department will not recognize your Foreign Tax Credit. '
            + 'You will be taxed on the full US income in India with no offset for taxes already paid.',
      fix: 'File Form 67 on the IT portal BEFORE submitting the ITR. This is mandatory.',
    });
  }
  checks.push({
    text: 'Form 67 / Form 44 filed',
    passed: !!input.form67Filed,
    note: !input.form67Filed ? 'Without this, FTC is forfeited entirely.' : null,
  });

  // --- Check 2: Form 67 filed BEFORE ITR ---
  if (input.form67Filed && !input.form67BeforeITR) {
    issues.push({
      code: 'FORM_67_AFTER_ITR',
      severity: 'high',
      title: 'Form 67 filed after ITR',
      detail: 'Form 67 must be filed BEFORE or simultaneously with the ITR. '
            + 'Filing it after may result in the FTC being disallowed on scrutiny.',
      fix: 'If ITR is not yet submitted, file Form 67 first. If already submitted, file a revised ITR.',
    });
  }
  if (input.form67Filed) {
    checks.push({
      text: 'Form 67 filed before ITR submission',
      passed: !!input.form67BeforeITR,
      note: !input.form67BeforeITR ? 'Sequence matters. FTC can be denied if order is wrong.' : null,
    });
  }

  // --- Check 3: Withholding rate check ---
  let effectiveWithholdingRate = null;
  if (input.usDividendIncome_USD > 0 && input.usWithheldTax_USD >= 0) {
    effectiveWithholdingRate = input.usWithheldTax_USD / input.usDividendIncome_USD;
    const maxAllowedRate = DTAA_USA.dividendMax;

    if (effectiveWithholdingRate > maxAllowedRate) {
      issues.push({
        code: 'WITHHOLDING_EXCEEDS_MAX',
        severity: 'medium',
        title: 'US withholding exceeds treaty maximum',
        detail: `Effective withholding rate: ${(effectiveWithholdingRate * 100).toFixed(1)}%. `
              + `US-India DTAA caps this at ${maxAllowedRate * 100}%. `
              + 'Excess withholding may be claimable as a US tax refund.',
        fix: 'Check if your W-8BEN was correctly submitted to your US broker. '
           + 'File for US refund of excess withholding via IRS Form 1040-NR if applicable.',
      });
    }

    // FTC available = min(India tax on that income, US taxes paid)
    // We flag if user is claiming more FTC than taxes paid
    checks.push({
      text: `US withholding within DTAA limit (individual treaty rate ${maxAllowedRate * 100}%)`,
      passed: effectiveWithholdingRate <= maxAllowedRate,
      note: effectiveWithholdingRate
        ? `Your rate: ${(effectiveWithholdingRate * 100).toFixed(1)}%. Treaty caps individuals at ${maxAllowedRate * 100}%; 15% applies only to companies holding >=10%.`
        : null,
    });
  }

  // --- Check 4: Exchange rate source ---
  if (input.exchangeRateSource !== 'SBI_TT') {
    issues.push({
      code: 'WRONG_EXCHANGE_RATE',
      severity: 'medium',
      title: 'Exchange rate source not SBI TT Buying Rate',
      detail: 'CBDT requires the SBI TT (Telegraphic Transfer) Buying Rate for the last day of the month '
            + 'preceding the date of income. Using any other rate (Google, XE, broker rate) '
            + 'can result in incorrect income figures and potential notices.',
      fix: 'Use the official SBI TT Buying Rate. This app can fetch it for you.',
    });
  }
  checks.push({
    text: 'SBI TT Buying Rate used for USD-INR conversion',
    passed: input.exchangeRateSource === 'SBI_TT',
    note: input.exchangeRateSource !== 'SBI_TT'
      ? `Current source: ${input.exchangeRateSource || 'unknown'}. CBDT mandates SBI TT rate.`
      : null,
  });

  // --- Check 5: CA signature for large credits ---
  const creditAmount = input.usWithheldTax_INR || 0;
  if (creditAmount > FORM_67_THRESHOLD_INR && !input.caSignatureObtained) {
    issues.push({
      code: 'CA_SIGNATURE_REQUIRED',
      severity: 'high',
      title: 'CA digital signature required',
      detail: `Your FTC claim (INR ${(creditAmount / 100000).toFixed(1)}L) exceeds the INR 5L threshold. `
            + 'As of 2026, credits above this amount require a CA\'s digital signature on Form 67.',
      fix: 'Engage a CA to countersign your Form 67 before submission.',
    });
  }
  if (creditAmount > FORM_67_THRESHOLD_INR) {
    checks.push({
      text: 'CA digital signature obtained for FTC above INR 5L',
      passed: !!input.caSignatureObtained,
      note: !input.caSignatureObtained ? 'Required for credit claims above INR 5L (2026 rule).' : null,
    });
  }

  // --- Compute claimable FTC ---
  const claimableFTC = computeFTC(input);

  // --- Risk level ---
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');
  const riskLevel = hasCritical ? 'critical' : hasHigh ? 'high' : issues.length > 0 ? 'medium' : 'low';

  return {
    riskLevel,
    issueCount: issues.length,
    issues,
    checks,
    claimableFTC,
    effectiveWithholdingRate,
    summary: buildDTAASummary(riskLevel, claimableFTC, issues.length),
  };
}

/**
 * Compute the actual FTC claimable (lower of Indian tax on the income or US tax paid)
 * Simplified: FTC = min(US tax paid in INR, Indian tax rate * US income in INR)
 */
function computeFTC(input) {
  if (!input.usDividendIncome_INR || !input.usWithheldTax_INR) return null;
  // Indian tax on dividend income at slab rate - simplified to 30% marginal for high earners
  // In production this needs the user's marginal rate from tax calculation
  const indianTaxOnUSIncome = input.usDividendIncome_INR * 0.30;
  const usTaxPaid = input.usWithheldTax_INR;
  const claimable = Math.min(indianTaxOnUSIncome, usTaxPaid);
  return {
    indianTaxOnUSIncome: Math.round(indianTaxOnUSIncome),
    usTaxPaidINR: Math.round(usTaxPaid),
    claimableINR: Math.round(claimable),
    note: 'Marginal rate used at 30%. Use your actual slab rate for precise calculation.',
  };
}

function buildDTAASummary(riskLevel, ftc, count) {
  if (riskLevel === 'critical') return 'FTC will be forfeited without Form 67. File it before the ITR.';
  if (riskLevel === 'low' && ftc) {
    return `DTAA compliance appears in order. Estimated FTC claimable: INR ${(ftc.claimableINR / 1000).toFixed(1)}K.`;
  }
  return `${count} item(s) to resolve before filing.`;
}
