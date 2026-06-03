/**
 * scheduleFAValidator.js
 *
 * Validates Schedule FA (Foreign Assets) compliance.
 * The three systemic failure points in every AI tax tool:
 *   1. Temporal mismatch: Schedule FA needs Calendar Year (Jan-Dec), not FY (Apr-Mar)
 *   2. Peak value: Must report HIGHEST intra-year balance, not year-end
 *   3. Signing authority: Accounts where user has signing rights but no ownership
 *
 * Black Money Act penalty: INR 10,00,000 flat per omission
 */

import { BLACK_MONEY_PENALTY } from './taxRates';

/**
 * @param {Object} input
 * @param {string} input.reportingYear        - "FY" or "CY" (what the user's source data uses)
 * @param {number} input.yearEndBalance        - Balance on Dec 31 (USD)
 * @param {number|null} input.peakBalance      - Highest balance during CY (USD). null = not tracked
 * @param {boolean} input.hasSigningAuthority  - User has signing authority on accounts they don't own
 * @param {boolean} input.signingAuthorityDeclared - Was that declared?
 * @param {Array<Object>} input.accounts       - List of foreign accounts/assets to validate
 *   Each: { name, type, yearEndBalance, peakBalance, hasPeakData, countryCode }
 *
 * @returns {Object} validation result with issues, risk level, and checklist
 */
export function validateScheduleFA(input) {
  const issues = [];
  const checks = [];

  // --- Check 1: Temporal mismatch ---
  if (input.reportingYear === 'FY') {
    issues.push({
      code: 'TEMPORAL_MISMATCH',
      severity: 'critical',
      title: 'Calendar Year vs Fiscal Year mismatch',
      detail: 'Schedule FA requires reporting for Jan 1 - Dec 31 (Calendar Year). '
            + 'Your source data appears to be Apr-Mar (Fiscal Year). '
            + 'Months Jan-Mar will be incorrectly attributed.',
      fix: 'Re-extract your foreign account statements for Jan 1 - Dec 31 of the relevant year.',
    });
  }
  checks.push({
    text: 'Reporting period is Calendar Year (Jan-Dec)',
    passed: input.reportingYear === 'CY',
    note: input.reportingYear === 'FY'
      ? 'Critical: Schedule FA uses CY, not FY. Mismatch triggers scrutiny.'
      : null,
  });

  // --- Check 2: Peak value ---
  const accountsWithoutPeak = (input.accounts || []).filter(a => !a.hasPeakData);
  if (accountsWithoutPeak.length > 0) {
    issues.push({
      code: 'PEAK_VALUE_MISSING',
      severity: 'high',
      title: 'Peak balance not tracked',
      detail: `${accountsWithoutPeak.length} account(s) missing intra-year peak balance data. `
            + 'Schedule FA requires the HIGHEST balance during the year, not the Dec 31 closing balance.',
      affectedAccounts: accountsWithoutPeak.map(a => a.name),
      fix: 'Pull monthly statements from your US broker/bank. The peak month is what you report.',
    });
  }
  checks.push({
    text: 'Peak (highest) intra-year balance tracked for all accounts',
    passed: accountsWithoutPeak.length === 0,
    note: accountsWithoutPeak.length > 0
      ? `Missing for: ${accountsWithoutPeak.map(a => a.name).join(', ')}`
      : null,
  });

  // --- Check 3: Signing authority ---
  if (input.hasSigningAuthority && !input.signingAuthorityDeclared) {
    issues.push({
      code: 'SIGNING_AUTHORITY_OMISSION',
      severity: 'critical',
      title: 'Signing authority not declared',
      detail: 'You have signing authority on accounts you do not own. '
            + 'These must be declared in Schedule FA under the Black Money Act regardless of ownership.',
      penalty: `Flat penalty: INR ${(BLACK_MONEY_PENALTY / 100000).toFixed(0)} Lakh per omission`,
      fix: 'Declare all accounts where you hold signing authority in Schedule FA Part B.',
    });
  }
  if (input.hasSigningAuthority !== undefined) {
    checks.push({
      text: 'Signing authority accounts declared (if applicable)',
      passed: !input.hasSigningAuthority || input.signingAuthorityDeclared,
      note: input.hasSigningAuthority && !input.signingAuthorityDeclared
        ? 'Omission = INR 10L flat penalty under Black Money Act'
        : null,
    });
  }

  // --- Determine overall risk level ---
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');
  const riskLevel = hasCritical ? 'critical' : hasHigh ? 'high' : issues.length > 0 ? 'medium' : 'low';

  return {
    riskLevel,
    issueCount: issues.length,
    issues,
    checks,
    penaltyExposure: hasCritical ? BLACK_MONEY_PENALTY : 0,
    summary: buildSummary(riskLevel, issues.length),
  };
}

function buildSummary(riskLevel, count) {
  if (riskLevel === 'low') return 'Schedule FA appears complete. Verify exchange rates before submission.';
  if (riskLevel === 'critical') return `${count} critical issue(s) found. Do not file until resolved. Black Money Act exposure.`;
  if (riskLevel === 'high') return `${count} issue(s) require attention before filing.`;
  return `${count} item(s) to review. Low penalty risk but worth correcting.`;
}
