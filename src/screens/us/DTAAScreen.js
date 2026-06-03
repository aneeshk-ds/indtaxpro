import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';
import RiskBadge from '../../components/RiskBadge';
import ChecklistItem from '../../components/ChecklistItem';
import { checkDTAA } from '../../logic/dtaaChecker';
import { getSBIRateForDate } from '../../logic/sbiRates';

export default function DTAAScreen({ route, navigation }) {
  const { incomeData, scheduleFAResult } = route.params || {};

  const divUSD = parseFloat(incomeData?.usDividendUSD) || 0;
  const withheldUSD = parseFloat(incomeData?.usWithheldTaxUSD) || 0;

  // Get SBI TT rate for current month (March end for FY2025-26)
  const sbiInfo = getSBIRateForDate('2025-03-15');
  const defaultRate = sbiInfo.rate || 85.94;

  const [form, setForm] = useState({
    form67Filed: null,
    form67BeforeITR: null,
    exchangeRateSource: null,
    caSignatureObtained: false,
  });

  const [result, setResult] = useState(null);

  const set = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (updated.form67Filed !== null && updated.exchangeRateSource !== null) {
      runCheck(updated);
    }
  };

  const runCheck = (f) => {
    const res = checkDTAA({
      form67Filed: f.form67Filed,
      form67BeforeITR: f.form67BeforeITR,
      usDividendIncome_INR: divUSD * defaultRate,
      usWithheldTax_INR: withheldUSD * defaultRate,
      usDividendIncome_USD: divUSD,
      usWithheldTax_USD: withheldUSD,
      caSignatureObtained: f.caSignatureObtained,
      exchangeRateSource: f.exchangeRateSource,
    });
    setResult(res);
  };

  const canContinue = result !== null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {divUSD > 0 && (
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>SBI TT Buying Rate used</Text>
            <Text style={styles.rateValue}>INR {defaultRate.toFixed(2)} / USD</Text>
            <Text style={styles.rateNote}>{sbiInfo.note}</Text>
            <Text style={styles.rateNote}>
              US dividends: ${divUSD} = INR {Math.round(divUSD * defaultRate).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Q1: Form 67 filed */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>01</Text>
          <Text style={styles.qText}>Have you filed Form 67 / Form 44?</Text>
          <Text style={styles.qNote}>
            This must be filed BEFORE your ITR to claim the Foreign Tax Credit.
            Without it, you lose the credit entirely.
          </Text>
          <View style={styles.optionRow}>
            {[
              { val: true, label: 'Yes, filed' },
              { val: false, label: 'Not yet' },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[styles.option,
                  form.form67Filed === opt.val && styles.optionSelected,
                  opt.val === false && form.form67Filed === false && styles.optionDanger]}
                onPress={() => set('form67Filed', opt.val)}
              >
                <Text style={[styles.optionLabel,
                  form.form67Filed === opt.val && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.form67Filed && (
            <View style={styles.subQ}>
              <Text style={styles.subQLabel}>Filed before ITR submission?</Text>
              <View style={styles.optionRow}>
                {[
                  { val: true, label: 'Yes, before' },
                  { val: false, label: 'After ITR' },
                ].map(opt => (
                  <TouchableOpacity
                    key={String(opt.val)}
                    style={[styles.option,
                      form.form67BeforeITR === opt.val && styles.optionSelected,
                      opt.val === false && form.form67BeforeITR === false && styles.optionDanger]}
                    onPress={() => set('form67BeforeITR', opt.val)}
                  >
                    <Text style={[styles.optionLabel,
                      form.form67BeforeITR === opt.val && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Q2: Exchange rate */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>02</Text>
          <Text style={styles.qText}>Exchange rate source used for USD income conversion</Text>
          <View style={styles.optionRow}>
            {[
              { val: 'SBI_TT', label: 'SBI TT Rate', sub: 'Correct method' },
              { val: 'custom', label: 'Google / XE', sub: 'May trigger notice' },
              { val: 'unknown', label: 'Not sure', sub: '' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.val}
                style={[styles.option,
                  form.exchangeRateSource === opt.val && styles.optionSelected,
                  opt.val !== 'SBI_TT' && form.exchangeRateSource === opt.val && styles.optionWarning]}
                onPress={() => set('exchangeRateSource', opt.val)}
              >
                <Text style={[styles.optionLabel,
                  form.exchangeRateSource === opt.val && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {opt.sub ? <Text style={styles.optionSub}>{opt.sub}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CA Signature if high credit */}
        {withheldUSD * defaultRate > 500000 && (
          <View style={styles.questionCard}>
            <Text style={styles.qNumber}>03</Text>
            <Text style={styles.qText}>
              Your FTC claim is above INR 5L. CA digital signature required (2026 rule).
            </Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>CA signature obtained on Form 67</Text>
              <Switch
                value={form.caSignatureObtained}
                onValueChange={v => set('caSignatureObtained', v)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.text}
              />
            </View>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>DTAA Assessment</Text>
              <RiskBadge level={result.riskLevel} />
            </View>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            <View style={styles.divider} />

            {result.checks.map((c, i) => (
              <ChecklistItem key={i} text={c.text} passed={c.passed} note={c.note} />
            ))}

            {result.claimableFTC && (
              <View style={styles.ftcBox}>
                <Text style={styles.ftcLabel}>Estimated claimable FTC</Text>
                <Text style={styles.ftcAmount}>
                  INR {result.claimableFTC.claimableINR.toLocaleString()}
                </Text>
                <Text style={styles.ftcNote}>{result.claimableFTC.note}</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={() => navigation.navigate('RiskReport', {
            incomeData,
            scheduleFAResult,
            dtaaResult: result,
          })}
          disabled={!canContinue}
        >
          <Text style={styles.btnText}>Generate Risk Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  rateCard: {
    ...card,
    borderColor: colors.accent + '50',
    marginBottom: spacing.md,
  },
  rateLabel: { ...typography.label, color: colors.accent },
  rateValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  rateNote: { ...typography.small, marginTop: 4 },
  questionCard: { ...card, marginBottom: spacing.md },
  qNumber: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1, marginBottom: spacing.sm },
  qText: { ...typography.h3, marginBottom: spacing.sm },
  qNote: { ...typography.small, marginBottom: spacing.md, fontStyle: 'italic' },
  optionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  option: {
    flex: 1,
    minWidth: 90,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
    gap: 4,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: '#001a0f' },
  optionDanger: { borderColor: colors.danger, backgroundColor: '#1a0000' },
  optionWarning: { borderColor: colors.warning, backgroundColor: '#1a1200' },
  optionLabel: { ...typography.body, fontWeight: '600' },
  optionLabelSelected: { color: colors.accent },
  optionSub: { ...typography.small },
  subQ: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  subQLabel: { ...typography.label, marginBottom: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  toggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  resultCard: { ...card, marginTop: spacing.md },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  resultTitle: { ...typography.h3 },
  resultSummary: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  ftcBox: {
    backgroundColor: '#001a0f',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  ftcLabel: { ...typography.label, color: colors.accent },
  ftcAmount: { fontSize: 24, fontWeight: '700', color: colors.accent, marginTop: 4 },
  ftcNote: { ...typography.small, marginTop: 4 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
});
