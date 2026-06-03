import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, card } from '../../theme';
import RiskBadge from '../../components/RiskBadge';
import ChecklistItem from '../../components/ChecklistItem';
import { computeRiskScore } from '../../logic/riskScorer';
import { getRSUResult } from '../../state/rsuStore';

const RISK_SCORE_COLORS = {
  low: colors.accent,
  medium: colors.warning,
  high: '#ff8c42',
  critical: colors.danger,
};

export default function RiskReportScreen({ route, navigation }) {
  const { incomeData, scheduleFAResult, dtaaResult } = route.params || {};
  const rsuResult = getRSUResult();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const score = computeRiskScore({
      scheduleFA: scheduleFAResult,
      dtaa: dtaaResult,
      rsu: rsuResult,
    });
    setReport(score);
  }, []);

  if (!report) return null;

  const scoreColor = RISK_SCORE_COLORS[report.riskBand] || colors.accent;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Score Hero */}
        <View style={[styles.scoreCard, { borderColor: scoreColor }]}>
          <Text style={styles.scoreLabel}>FILING RISK SCORE</Text>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{report.score}</Text>
          <Text style={styles.scoreMax}>out of 100</Text>
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, { width: `${report.score}%`, backgroundColor: scoreColor }]} />
          </View>
          <Text style={[styles.scoreBand, { color: scoreColor }]}>
            {report.riskBand.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.summary}>{report.summary}</Text>

        {/* Penalty exposure */}
        {report.totalPenaltyExposure > 0 && (
          <View style={styles.penaltyCard}>
            <Text style={styles.penaltyLabel}>Total penalty exposure</Text>
            <Text style={styles.penaltyAmount}>
              INR {(report.totalPenaltyExposure / 100000).toFixed(1)} Lakh
            </Text>
            {report.penaltyExposure.map((p, i) => (
              <Text key={i} style={styles.penaltyItem}>
                {p.source}: {p.description}
              </Text>
            ))}
          </View>
        )}

        {/* Action list */}
        {report.actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions before filing</Text>
            {report.actions.map((action, i) => (
              <View key={i} style={styles.actionItem}>
                <View style={[styles.actionDot, {
                  backgroundColor: action.severity === 'critical' ? colors.danger
                    : action.severity === 'high' ? colors.warning : colors.muted
                }]} />
                <View style={styles.actionText}>
                  <Text style={styles.actionSource}>{action.source}</Text>
                  <Text style={styles.actionDesc}>{action.action}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Schedule FA summary */}
        {scheduleFAResult && (
          <View style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>Schedule FA</Text>
              <RiskBadge level={scheduleFAResult.riskLevel} />
            </View>
            {scheduleFAResult.checks.map((c, i) => (
              <ChecklistItem key={i} text={c.text} passed={c.passed} note={c.note} />
            ))}
          </View>
        )}

        {/* DTAA summary */}
        {dtaaResult && (
          <View style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>DTAA / Form 67</Text>
              <RiskBadge level={dtaaResult.riskLevel} />
            </View>
            {dtaaResult.checks.map((c, i) => (
              <ChecklistItem key={i} text={c.text} passed={c.passed} note={c.note} />
            ))}
            {dtaaResult.claimableFTC && (
              <View style={styles.ftcInline}>
                <Text style={styles.ftcInlineLabel}>Claimable FTC</Text>
                <Text style={styles.ftcInlineValue}>
                  INR {dtaaResult.claimableFTC.claimableINR.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* RSU / ESPP summary */}
        {rsuResult && (
          <View style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>RSU / ESPP</Text>
            </View>
            <View style={styles.ftcInline}>
              <Text style={styles.ftcInlineLabel}>Perquisite (salary)</Text>
              <Text style={styles.ftcInlineValue}>
                INR {rsuResult.summary.totalPerquisiteINR.toLocaleString()}
              </Text>
            </View>
            <View style={styles.ftcInline}>
              <Text style={styles.ftcInlineLabel}>Long-term CG tax</Text>
              <Text style={styles.ftcInlineValue}>
                INR {rsuResult.summary.totalCGTax.toLocaleString()}
              </Text>
            </View>
            {rsuResult.issues.map((iss, i) => (
              <Text key={i} style={styles.rsuFlag}>{iss.title}</Text>
            ))}
          </View>
        )}

        {/* FAST-DS disclosure window note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Past omissions? FAST-DS window</Text>
          <Text style={styles.infoText}>
            If you have undeclared foreign assets from prior years, the 2026 FAST-DS (Foreign Asset
            Self-Disclosure Scheme) window allows corrected disclosure and reduces the INR 10L
            penalty. Consult a CA before the window closes.
          </Text>
        </View>

        {/* CA review trigger */}
        {(parseFloat(incomeData?.usDividendUSD) + parseFloat(incomeData?.usSalaryUSD || 0)) * 84.5 > 850000 && (
          <View style={styles.caCard}>
            <Text style={styles.caTitle}>CA review recommended</Text>
            <Text style={styles.caText}>
              Your US assets likely exceed $10,000 (approx INR 8.5L). Manual CA review of this
              AI-generated report is advisable before filing.
            </Text>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('IncomeInput')}
        >
          <Text style={styles.btnText}>Start new assessment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  scoreCard: {
    ...card,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  scoreLabel: { ...typography.label, marginBottom: spacing.sm },
  scoreNumber: { fontSize: 72, fontWeight: '800', lineHeight: 80 },
  scoreMax: { ...typography.small, marginBottom: spacing.md },
  scoreBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreBand: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  summary: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  penaltyCard: {
    backgroundColor: '#1a0000',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  penaltyLabel: { ...typography.label, color: colors.danger },
  penaltyAmount: { fontSize: 28, fontWeight: '800', color: colors.danger, marginTop: 4, marginBottom: 8 },
  penaltyItem: { ...typography.small, color: '#ff9999', marginTop: 2 },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  actionText: { flex: 1 },
  actionSource: { ...typography.label, marginBottom: 2 },
  actionDesc: { ...typography.body },
  moduleCard: { ...card, marginBottom: spacing.md },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  moduleTitle: { ...typography.h3 },
  ftcInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ftcInlineLabel: { ...typography.label },
  ftcInlineValue: { ...typography.accent, fontSize: 18, fontWeight: '700' },
  infoBox: { ...card, marginBottom: spacing.md, borderColor: colors.accent + '30' },
  rsuFlag: { ...typography.small, color: colors.warning, marginTop: spacing.sm },
  infoTitle: { ...typography.label, color: colors.accent, marginBottom: spacing.sm },
  infoText: { ...typography.small, lineHeight: 20 },
  caCard: {
    backgroundColor: '#1a1200',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  caTitle: { ...typography.label, color: colors.warning, marginBottom: spacing.sm },
  caText: { ...typography.small, lineHeight: 20 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  btn: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnText: { ...typography.body, fontWeight: '600' },
});
