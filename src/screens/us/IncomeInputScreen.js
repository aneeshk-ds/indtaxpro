import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';

export default function IncomeInputScreen({ navigation }) {
  const [form, setForm] = useState({
    usSalaryUSD: '',
    usDividendUSD: '',
    usWithheldTaxUSD: '',
    hasRSU: false,
    hasESPP: false,
    assessmentYear: '2025-26',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    navigation.navigate('ScheduleFA', { incomeData: form });
  };

  const hasAnyIncome = form.usSalaryUSD || form.usDividendUSD;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.section}>Assessment Year</Text>
        <View style={styles.ayRow}>
          {['2024-25', '2025-26', '2026-27'].map(ay => (
            <TouchableOpacity
              key={ay}
              style={[styles.ayChip, form.assessmentYear === ay && styles.ayChipActive]}
              onPress={() => set('assessmentYear', ay)}
            >
              <Text style={[styles.ayText, form.assessmentYear === ay && styles.ayTextActive]}>
                AY {ay}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>US Income</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>US Salary / W-2 income (USD)</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>$</Text>
            <TextInput
              style={styles.input}
              value={form.usSalaryUSD}
              onChangeText={v => set('usSalaryUSD', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>US Dividends (USD)</Text>
          <Text style={styles.hint}>From 1099-DIV or broker statement</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>$</Text>
            <TextInput
              style={styles.input}
              value={form.usDividendUSD}
              onChangeText={v => set('usDividendUSD', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>US Federal Tax Withheld (USD)</Text>
          <Text style={styles.hint}>From Form 1042-S or broker statement</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>$</Text>
            <TextInput
              style={styles.input}
              value={form.usWithheldTaxUSD}
              onChangeText={v => set('usWithheldTaxUSD', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <Text style={styles.section}>Equity Compensation</Text>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>I have RSUs (Restricted Stock Units)</Text>
            <Text style={styles.toggleHint}>Vesting events, sale of vested shares</Text>
          </View>
          <Switch
            value={form.hasRSU}
            onValueChange={v => set('hasRSU', v)}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>I have ESPP (Employee Stock Purchase Plan)</Text>
            <Text style={styles.toggleHint}>Discounted stock purchases</Text>
          </View>
          <Switch
            value={form.hasESPP}
            onValueChange={v => set('hasESPP', v)}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What gets checked next</Text>
          <Text style={styles.infoText}>
            Schedule FA compliance (temporal mismatch, peak value, signing authority)
            {'\n'}DTAA / Form 67 status
            {'\n'}{form.hasRSU ? 'RSU vesting vs sale split' : ''}
            {form.hasESPP ? '\nESPP discount vs capital gain split' : ''}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !hasAnyIncome && styles.btnDisabled]}
          onPress={handleNext}
          disabled={!hasAnyIncome}
        >
          <Text style={styles.btnText}>Continue to Schedule FA Check</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  ayRow: { flexDirection: 'row', gap: spacing.sm },
  ayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  ayChipActive: { borderColor: colors.accent, backgroundColor: '#001a0f' },
  ayText: { ...typography.small, color: colors.muted },
  ayTextActive: { color: colors.accent, fontWeight: '600' },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 4 },
  hint: { ...typography.small, marginBottom: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  prefix: { ...typography.body, color: colors.muted, marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  toggleHint: { ...typography.small, marginTop: 2 },
  infoBox: {
    ...card,
    marginTop: spacing.xl,
    borderColor: colors.accent + '40',
  },
  infoTitle: { ...typography.label, color: colors.accent, marginBottom: spacing.sm },
  infoText: { ...typography.small, lineHeight: 22 },
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
