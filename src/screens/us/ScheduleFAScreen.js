import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';
import RiskBadge from '../../components/RiskBadge';
import ChecklistItem from '../../components/ChecklistItem';
import { validateScheduleFA } from '../../logic/scheduleFAValidator';

export default function ScheduleFAScreen({ route, navigation }) {
  const { incomeData } = route.params || {};

  const [form, setForm] = useState({
    reportingYear: null,        // 'CY' or 'FY'
    hasPeakData: null,          // true/false
    hasSigningAuthority: null,
    signingAuthorityDeclared: false,
    accountCount: '1',
  });

  const [result, setResult] = useState(null);

  const set = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    // Auto-run validation when all required fields are answered
    if (updated.reportingYear !== null && updated.hasPeakData !== null && updated.hasSigningAuthority !== null) {
      runValidation(updated);
    }
  };

  const runValidation = (f) => {
    const accounts = Array.from({ length: parseInt(f.accountCount) || 1 }, (_, i) => ({
      name: `Account ${i + 1}`,
      hasPeakData: f.hasPeakData,
    }));
    const res = validateScheduleFA({
      reportingYear: f.reportingYear,
      accounts,
      hasSigningAuthority: f.hasSigningAuthority,
      signingAuthorityDeclared: f.signingAuthorityDeclared,
    });
    setResult(res);
  };

  const canContinue = result !== null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          Schedule FA is where most Indian filers with US accounts get penalized.
          Answer 3 questions.
        </Text>

        {/* Question 1: Data period */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>01</Text>
          <Text style={styles.qText}>
            Your US account statements - what period do they cover?
          </Text>
          <Text style={styles.qNote}>
            Schedule FA requires Calendar Year (Jan-Dec), not Fiscal Year (Apr-Mar)
          </Text>
          <View style={styles.optionRow}>
            {[
              { val: 'CY', label: 'Jan - Dec', sub: 'Calendar Year' },
              { val: 'FY', label: 'Apr - Mar', sub: 'Fiscal Year' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.val}
                style={[styles.option, form.reportingYear === opt.val && styles.optionSelected,
                  opt.val === 'FY' && form.reportingYear === 'FY' && styles.optionDanger]}
                onPress={() => set('reportingYear', opt.val)}
              >
                <Text style={[styles.optionLabel, form.reportingYear === opt.val && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 2: Peak balance */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>02</Text>
          <Text style={styles.qText}>
            Do you have the HIGHEST balance your account reached during the year?
          </Text>
          <Text style={styles.qNote}>
            Not the Dec 31 closing balance. The peak value at any point in the year.
          </Text>
          <View style={styles.optionRow}>
            {[
              { val: true, label: 'Yes, I have it', sub: 'From monthly statements' },
              { val: false, label: 'No, only year-end', sub: 'Will need to pull statements' },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[styles.option,
                  form.hasPeakData === opt.val && styles.optionSelected,
                  opt.val === false && form.hasPeakData === false && styles.optionDanger]}
                onPress={() => set('hasPeakData', opt.val)}
              >
                <Text style={[styles.optionLabel, form.hasPeakData === opt.val && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 3: Signing authority */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>03</Text>
          <Text style={styles.qText}>
            Do you have signing authority on any US account you do not own?
          </Text>
          <Text style={styles.qNote}>
            Example: your employer's account, a parent's account, a business account.
          </Text>
          <View style={styles.optionRow}>
            {[
              { val: false, label: 'No', sub: 'Only my own accounts' },
              { val: true, label: 'Yes', sub: "I can sign on others'" },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[styles.option, form.hasSigningAuthority === opt.val && styles.optionSelected]}
                onPress={() => set('hasSigningAuthority', opt.val)}
              >
                <Text style={[styles.optionLabel, form.hasSigningAuthority === opt.val && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.hasSigningAuthority && (
            <View style={styles.subToggle}>
              <Text style={styles.subToggleLabel}>Was it declared in last year's Schedule FA?</Text>
              <Switch
                value={form.signingAuthorityDeclared}
                onValueChange={v => set('signingAuthorityDeclared', v)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.text}
              />
            </View>
          )}
        </View>

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Schedule FA Assessment</Text>
              <RiskBadge level={result.riskLevel} />
            </View>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            <View style={styles.divider} />

            {result.checks.map((c, i) => (
              <ChecklistItem key={i} text={c.text} passed={c.passed} note={c.note} />
            ))}

            {result.penaltyExposure > 0 && (
              <View style={styles.penaltyBox}>
                <Text style={styles.penaltyLabel}>Penalty exposure</Text>
                <Text style={styles.penaltyAmount}>
                  INR {(result.penaltyExposure / 100000).toFixed(0)} Lakh
                </Text>
                <Text style={styles.penaltyNote}>Black Money Act - flat penalty per omission</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={() => navigation.navigate('DTAA', { incomeData, scheduleFAResult: result })}
          disabled={!canContinue}
        >
          <Text style={styles.btnText}>Continue to DTAA Check</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  questionCard: {
    ...card,
    marginBottom: spacing.md,
  },
  qNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  qText: { ...typography.h3, marginBottom: spacing.sm },
  qNote: { ...typography.small, marginBottom: spacing.md, fontStyle: 'italic' },
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
    gap: 4,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: '#001a0f' },
  optionDanger: { borderColor: colors.danger, backgroundColor: '#1a0000' },
  optionLabel: { ...typography.body, fontWeight: '600' },
  optionLabelSelected: { color: colors.accent },
  optionSub: { ...typography.small },
  subToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subToggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  resultCard: { ...card, marginTop: spacing.md, borderColor: colors.accent + '30' },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: { ...typography.h3 },
  resultSummary: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  penaltyBox: {
    backgroundColor: '#1a0000',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  penaltyLabel: { ...typography.label, color: colors.danger },
  penaltyAmount: { fontSize: 24, fontWeight: '700', color: colors.danger, marginTop: 4 },
  penaltyNote: { ...typography.small, color: '#ff9999', marginTop: 4 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
});
