/**
 * riskScorer.js
 *
 * Aggregates outputs from all validators into a single risk score and
 * produces a prioritized action list.
 */

/**
 * @param {Object} results
 * @param {Object} results.scheduleFA  - from scheduleFAValidator
 * @param {Object} results.dtaa        - from dtaaChecker
 * @param {Object} results.rsu         - from rsuCalculator
 *
 * @returns {Object} composite risk score and ordered action list
 */
export function computeRiskScore(results) {
  const { scheduleFA, dtaa, rsu } = results;
  let score = 0;
  const actions = [];
  const penaltyExposure = [];

  // --- Schedule FA scoring ---
  if (scheduleFA) {
    for (const issue of scheduleFA.issues || []) {
      if (issue.severity === 'critical') {
        score += 40;
        penaltyExposure.push({ source: 'Schedule FA', amount: 1000000, description: issue.title });
      } else if (issue.severity === 'high') {
        score += 20;
      } else if (issue.severity === 'medium') {
        score += 10;
      }
      actions.push({
        priority: severityToPriority(issue.severity),
        source: 'Schedule FA',
        action: issue.fix || issue.title,
        severity: issue.severity,
      });
    }
  }

  // --- DTAA scoring ---
  if (dtaa) {
    for (const issue of dtaa.issues || []) {
      if (issue.severity === 'critical') {
        score += 35;
        penaltyExposure.push({ source: 'DTAA / FTC', amount: dtaa.claimableFTC?.claimableINR || 0, description: 'FTC forfeited' });
      } else if (issue.severity === 'high') {
        score += 20;
      } else if (issue.severity === 'medium') {
        score += 8;
      }
      actions.push({
        priority: severityToPriority(issue.severity),
        source: 'DTAA',
        action: issue.fix || issue.title,
        severity: issue.severity,
      });
    }
  }

  // --- RSU scoring ---
  if (rsu) {
    for (const issue of rsu.issues || []) {
      if (issue.severity === 'high') score += 20;
      else if (issue.severity === 'medium') score += 8;
      actions.push({
        priority: severityToPriority(issue.severity),
        source: 'RSU / ESPP',
        action: issue.title,
        severity: issue.severity,
      });
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  // Sort actions by priority
  actions.sort((a, b) => a.priority - b.priority);

  const riskBand = score >= 60 ? 'critical' : score >= 35 ? 'high' : score >= 15 ? 'medium' : 'low';

  const totalPenaltyExposure = penaltyExposure.reduce((sum, p) => sum + p.amount, 0);

  return {
    score,
    riskBand,
    totalPenaltyExposure,
    penaltyExposure,
    actions: actions.slice(0, 10), // Top 10 actions
    readyToFile: score === 0,
    summary: buildRiskSummary(riskBand, score, totalPenaltyExposure),
  };
}

function severityToPriority(severity) {
  return { critical: 1, high: 2, medium: 3, low: 4 }[severity] || 4;
}

function buildRiskSummary(band, score, penaltyINR) {
  if (band === 'critical') {
    return `Risk score: ${score}/100. Estimated penalty exposure: INR ${(penaltyINR / 100000).toFixed(1)}L. Do not file until critical items are resolved.`;
  }
  if (band === 'high') {
    return `Risk score: ${score}/100. High-risk items present. Review before filing.`;
  }
  if (band === 'medium') {
    return `Risk score: ${score}/100. Some items need attention. Filing is possible but not recommended without fixes.`;
  }
  return `Risk score: ${score}/100. No significant issues found. Proceed to filing.`;
}
