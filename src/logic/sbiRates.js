/**
 * sbiRates.js
 *
 * SBI TT (Telegraphic Transfer) Buying Rate fetcher and calculator.
 *
 * CBDT rule: Use SBI TT Buying Rate for the last day of the MONTH PRECEDING
 * the date the income is received/accrued.
 *
 * Example: Dividend received on March 15, 2025 -> use SBI TT rate for Feb 28, 2025
 *
 * In production, this would call the SBI API or scrape the RBI reference rate page.
 * For the prototype, we use a static lookup table of 2024-2025 monthly rates.
 */

// Static SBI TT Buying Rates (USD/INR) - month-end rates for prototype
// Source: SBI Treasury / RBI Reference Rate archive
// Key: "YYYY-MM" -> rate at month end
const SBI_TT_RATES = {
  '2024-01': 82.91,
  '2024-02': 82.87,
  '2024-03': 83.42,
  '2024-04': 83.57,
  '2024-05': 83.52,
  '2024-06': 83.45,
  '2024-07': 83.72,
  '2024-08': 83.88,
  '2024-09': 83.95,
  '2024-10': 84.07,
  '2024-11': 84.38,
  '2024-12': 84.72,
  '2025-01': 86.55,
  '2025-02': 87.12,
  '2025-03': 85.94,
  '2025-04': 84.82,
  '2025-05': 84.45,
  '2025-06': 84.20,
  '2025-07': 84.05,
  '2025-08': 83.90,
  '2025-09': 84.10,
  '2025-10': 84.30,
  '2025-11': 84.50,
  '2025-12': 84.65,
};

/**
 * Get the SBI TT rate applicable for a given income date.
 * CBDT rule: use rate from the last day of the PRECEDING month.
 *
 * @param {string} incomeDate - ISO date string "YYYY-MM-DD"
 * @returns {{ rate: number, rateMonth: string, note: string } | null}
 */
export function getSBIRateForDate(incomeDate) {
  // Parse explicit components so "YYYY-MM-DD" is a LOCAL date (avoids a UTC roll-back
  // that can shift the month near month boundaries in UTC-negative timezones).
  const [yy, mm] = String(incomeDate).split('-').map(Number);
  const date = new Date(yy, (mm || 1) - 1, 1);
  // Subtract one month
  const precedingMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const key = `${precedingMonth.getFullYear()}-${String(precedingMonth.getMonth() + 1).padStart(2, '0')}`;
  const rate = SBI_TT_RATES[key];

  if (!rate) {
    return {
      rate: null,
      rateMonth: key,
      note: `No SBI TT rate available for ${key}. Please enter manually from SBI Treasury website.`,
      manualRequired: true,
    };
  }

  return {
    rate,
    rateMonth: key,
    note: `SBI TT Buying Rate for ${key}: INR ${rate.toFixed(2)} per USD`,
    manualRequired: false,
  };
}

/**
 * Convert USD amount to INR using the correct SBI TT rate for the income date.
 * @param {number} amountUSD
 * @param {string} incomeDate - "YYYY-MM-DD"
 * @returns {{ amountINR: number, rate: number, rateMonth: string, note: string }}
 */
export function convertUSDtoINR(amountUSD, incomeDate) {
  const rateInfo = getSBIRateForDate(incomeDate);
  if (!rateInfo.rate) {
    return { amountINR: null, ...rateInfo };
  }
  return {
    amountINR: Math.round(amountUSD * rateInfo.rate * 100) / 100,
    rate: rateInfo.rate,
    rateMonth: rateInfo.rateMonth,
    note: rateInfo.note,
    manualRequired: false,
  };
}

/**
 * Validate that the rate used by user matches SBI TT rate.
 * Flags if deviation > 1%.
 */
export function validateExchangeRate(incomeDate, rateUsed) {
  const rateInfo = getSBIRateForDate(incomeDate);
  if (!rateInfo.rate) return { valid: false, note: rateInfo.note };

  const deviation = Math.abs(rateUsed - rateInfo.rate) / rateInfo.rate;
  if (deviation > 0.01) {
    return {
      valid: false,
      sbRate: rateInfo.rate,
      rateUsed,
      deviationPct: (deviation * 100).toFixed(2),
      note: `Rate used (${rateUsed}) deviates ${(deviation * 100).toFixed(2)}% from SBI TT rate (${rateInfo.rate}). Use SBI TT rate.`,
    };
  }
  return { valid: true, rate: rateInfo.rate, note: rateInfo.note };
}

/**
 * Get all available months in the rate table.
 */
export function getAvailableRateMonths() {
  return Object.keys(SBI_TT_RATES).sort();
}
