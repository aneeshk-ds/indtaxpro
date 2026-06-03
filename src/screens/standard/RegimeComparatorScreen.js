import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';
import {
  calcFinalTax, NEW_REGIME_SLABS, OLD_REGIME_SLABS,
  STANDARD_DEDUCTION_NEW, STANDARD_DEDUCTION_OLD,
  DEDUCTION_80C_LIMIT, DEDUCTION_80D_SELF, NPS_80CCD1B,
  applyNewRegimeRebate,
} from '../../logic/taxRates';

export default function RegimeComparatorScreen() {
  const [form, setForm] = useState({
    grossSalary: '',
    hra: '',
    hraExempt: '',
    deduction80C: '',
    deduction80D: '',
    nps80CCD: '',
    homeLoanInterest: '',
  });

  const [result, setResult] = useState(null);
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const calculate = () => {
    const gross = parseFloat(form.grossSalary) || 0;
    const d80C = Math.min(parseFloat(form.deduction80C) || 0, DEDUCTION_80C_LIMIT);
    const d80D = Math.min(parseFloat(form.deduction80D) || 0, DEDUCTION_80D_SELF);
    const nps = Math.min(parseFloat(form.nps80CCD) || 0, NPS_80CCD1B);
    const hraExempt = Math.min(parseFloat(form.hraExempt) || 0, parseFloat(form.hra) || 0);
    const homeLoan = parseFloat(form.homeLoanInterest) || 0;

    // OLD REGIME
    const oldTaxableIncome = Math.max(0,
      gross - STANDARD_DEDUCTION_OLD - d80C - d80D - nps - hraExempt - Math.min(homeLoan, 200000)
    );
    const oldTax = calcFinalTax(oldTaxableIncome, OLD_REGIME_SLABS, 'old');

    // NEW REGIME
    const newTaxableIncome = Math.max(0, gross - STANDARD_DEDUCTION_NEW);
    const newTaxBase = calcFinalTax(newTaxableIncome, NEW_REGIME_SLABS, 'new');
    const newTaxAfterRebate = applyNewRegimeRebate(newTaxableIncome, newTaxBase.total);
    const newTax = { ...newTaxBase, total: newTaxAfterRebate };

    const saving = oldTax.total - newTax.total;

    setResult({
      gross,
      oldRegime: { taxableIncome: oldTaxableIncome, ...oldTax },
      newRegime: { taxableIncome: newTaxableIncome, ...newTax },
      saving,
      recommendation: saving > 0 ? 'new' : 'old',
      deductionsUsed: { d80C, d80D, nps, hraExempt, homeLoan: Math.min(homeLoan, 200000) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          FY 2025-26. New regime standard deduction is INR 75,000.
          Old regime allows 80C, 80D, HRA, and home loan deductions.
        </Text>

        <Text style={styles.section}>Income</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gross salary (INR)</Text>
          <TextInput
            style={styles.input}
            value={form.grossSalary}
            onChangeText={v => set('grossSalary', v)}
            keyboardType="numeric"
            placeholder="1200000"
            placeholderTextColor={colors.muted}
          />
        </View>

        <Text style={styles.section}>Old Regime Deductions</Text>
        {[
          { key: 'deduction80C', label: '80C investments (PF, ELSS, LIC)', max: '1,50,000' },
          { key: 'deduction80D', label: '80D health insurance premium', max: '25,000' },
          { key: 'nps80CCD', label: 'NPS contribution 80CCD(1B)', max: '50,000' },
          { key: 'hraExempt', label: 'HRA exemption amount', max: 'actual' },
          { key: 'homeLoanInterest', label: 'Home loan interest (Sec 24)', max: '2,00,000' },
        ].map(item => (
          <View key={item.key} style={styles.inputGroup}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.hint}>Max: INR {item.max}</Text>
            <TextInput
              style={styles.input}
              value={form[item.key]}
              onChangeText={v => set(item.key, v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <Text style={styles.calcBtnText}>Compare regimes</Text>
        </TouchableOpacity>

        {result && (
          <>
            {/* Recommendation */}
            <View style={[styles.recCard, {
              borderColor: result.recommendation === 'new' ? colors.accent : colors.warning
            }]}>
              <Text style={styles.recLabel}>Recommendation</Text>
              <Text style={[styles.recValue, {
                color: result.recommendation === 'new' ? colors.accent : colors.warning
              }]}>
                {result.recommendation === 'new' ? 'New Regime' : 'Old Regime'}
              </Text>
              <Text style={styles.recSaving}>
                Saves INR {Math.abs(result.saving).toLocaleString()} vs the other option
              </Text>
            </View>

            {/* Side by side */}
            <View style={styles.compRow}>
              <View style={[styles.compCard, result.recommendation === 'old' && styles.compCardWinner]}>
                <Text style={styles.compLabel}>Old Regime</Text>
                <Text style={styles.compTaxable}>
                  Taxable: INR {result.oldRegime.taxableIncome.toLocaleString()}
                </Text>
                <Text style={styles.compTax}>
                  INR {result.oldRegime.total.toLocaleString()}
                </Text>
                <Text style={styles.compBreak}>
                  Base: {result.oldRegime.base.toLocaleString()}{'\n'}
                  Surcharge: {result.oldRegime.surcharge.toLocaleString()}{'\n'}
                  Cess: {result.oldRegime.cess.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.compCard, result.recommendation === 'new' && styles.compCardWinner]}>
                <Text style={styles.compLabel}>New Regime</Text>
                <Text style={styles.compTaxable}>
                  Taxable: INR {result.newRegime.taxableIncome.toLocaleString()}
                </Text>
                <Text style={styles.compTax}>
                  INR {result.newRegime.total.toLocaleString()}
                </Text>
                <Text style={styles.compBreak}>
                  Base: {result.newRegime.base.toLocaleString()}{'\n'}
                  Surcharge: {result.newRegime.surcharge.toLocaleString()}{'\n'}
                  Cess: {result.newRegime.cess.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Deductions summary */}
            <View style={styles.deductCard}>
              <Text style={styles.deductTitle}>Old Regime deductions used</Text>
              {Object.entries(result.deductionsUsed).map(([key, val]) =>
                val > 0 ? (
                  <View key={key} style={styles.deductRow}>
                    <Text style={styles.deductKey}>{key}</Text>
                    <Text style={styles.deductVal}>INR {val.toLocaleString()}</Text>
                  </View>
                ) : null
              )}
              <View style={[styles.deductRow, styles.deductTotal]}>
                <Text style={styles.deductKey}>Standard deduction</Text>
                <Text style={styles.deductVal}>INR {STANDARD_DEDUCTION_OLD.toLocaleString()}</Text>
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  section: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 4 },
  hint: { ...typography.small, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  calcBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  calcBtnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
  recCard: {
    ...card,
    marginBottom: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  recLabel: { ...typography.label, marginBottom: spacing.sm },
  recValue: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  recSaving: { ...typography.small },
  compRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  compCard: {
    flex: 1,
    ...card,
    gap: spacing.xs,
  },
  compCardWinner: { borderColor: colors.accent },
  compLabel: { ...typography.label },
  compTaxable: { ...typography.small },
  compTax: { fontSize: 22, fontWeight: '700', color: colors.text },
  compBreak: { ...typography.small, lineHeight: 20 },
  deductCard: { ...card },
  deductTitle: { ...typography.label, marginBottom: spacing.md },
  deductRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  deductTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
  deductKey: { ...typography.small },
  deductVal: { ...typography.small, color: colors.text, fontWeight: '600' },
});
