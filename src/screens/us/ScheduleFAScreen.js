import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';
import RiskBadge from '../../components/RiskBadge';
import ChecklistItem from '../../components/ChecklistItem';
import Accordion from '../../components/Accordion';
import { validateScheduleFA } from '../../logic/scheduleFAValidator';

export default function ScheduleFAScreen({ route, navigation }) {
  const { incomeData } = route.params || {};
  const [form, setForm] = useState({
    reportingYear: null, hasPeakData: null, hasSigningAuthority: null,
    signingAuthorityDeclared: false, accountCount: '1',
  });
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState('q1');
  const toggle = (id) => setOpen(open === id ? null : id);

  const set = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (updated.reportingYear !== null && updated.hasPeakData !== null && updated.hasSigningAuthority !== null) {
      runValidation(updated);
    }
    // auto-advance to the next unanswered section
    if (key === 'reportingYear') setOpen('q2');
    else if (key === 'hasPeakData') setOpen('q3');
  };

  const runValidation = (f) => {
    const accounts = Array.from({ length: parseInt(f.accountCount) || 1 }, (_, i) => ({
      name: `Account ${i + 1}`, hasPeakData: f.hasPeakData,
    }));
    setResult(validateScheduleFA({
      reportingYear: f.reportingYear, accounts,
      hasSigningAuthority: f.hasSigningAuthority, signingAuthorityDeclared: f.signingAuthorityDeclared,
    }));
  };

  const canContinue = result !== null;
  const ans = (v, yes, no) => v === null ? 'Not answered' : (v === 'CY' || v === true ? yes : no);

  const Option = ({ selected, danger, label, sub, onPress }) => (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected, danger && selected && styles.optionDanger]}
      onPress={onPress}
    >
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>Three questions. This is where most US-account filers get penalized.</Text>

        <Accordion title="1. Statement period" subtitle={ans(form.reportingYear, 'Calendar year', 'Fiscal year')}
          isOpen={open === 'q1'} onToggle={() => toggle('q1')} done={form.reportingYear !== null}>
          <Text style={styles.qNote}>Schedule FA needs Calendar Year (Jan to Dec), not Fiscal Year.</Text>
          <View style={styles.optionRow}>
            <Option selected={form.reportingYear === 'CY'} label="Jan - Dec" sub="Calendar Year" onPress={() => set('reportingYear', 'CY')} />
            <Option selected={form.reportingYear === 'FY'} danger label="Apr - Mar" sub="Fiscal Year" onPress={() => set('reportingYear', 'FY')} />
          </View>
        </Accordion>

        <Accordion title="2. Peak balance" subtitle={ans(form.hasPeakData, 'Have peak value', 'Year-end only')}
          isOpen={open === 'q2'} onToggle={() => toggle('q2')} done={form.hasPeakData !== null}>
          <Text style={styles.qNote}>You report the highest balance during the year, not the 31 December closing balance.</Text>
          <View style={styles.optionRow}>
            <Option selected={form.hasPeakData === true} label="Yes, I have it" sub="From monthly statements" onPress={() => set('hasPeakData', true)} />
            <Option selected={form.hasPeakData === false} danger label="No, year-end only" sub="Will need statements" onPress={() => set('hasPeakData', false)} />
          </View>
        </Accordion>

        <Accordion title="3. Signing authority" subtitle={ans(form.hasSigningAuthority, 'Yes', 'No')}
          isOpen={open === 'q3'} onToggle={() => toggle('q3')} done={form.hasSigningAuthority !== null}>
          <Text style={styles.qNote}>Accounts you can sign on but do not own must still be declared.</Text>
          <View style={styles.optionRow}>
            <Option selected={form.hasSigningAuthority === false} label="No" sub="Only my accounts" onPress={() => set('hasSigningAuthority', false)} />
            <Option selected={form.hasSigningAuthority === true} label="Yes" sub="I can sign on others" onPress={() => set('hasSigningAuthority', true)} />
          </View>
          {form.hasSigningAuthority && (
            <View style={styles.subToggle}>
              <Text style={styles.subToggleLabel}>Declared in last year's Schedule FA?</Text>
              <Switch value={form.signingAuthorityDeclared} onValueChange={v => set('signingAuthorityDeclared', v)}
                trackColor={{ true: colors.accent, false: colors.border }} thumbColor={colors.text} />
            </View>
          )}
        </Accordion>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Schedule FA assessment</Text>
              <RiskBadge level={result.riskLevel} />
            </View>
            <Text style={styles.resultSummary}>{result.summary}</Text>
            <View style={styles.divider} />
            {result.checks.map((c, i) => <ChecklistItem key={i} text={c.text} passed={c.passed} note={c.note} />)}
            {result.penaltyExposure > 0 && (
              <View style={styles.penaltyBox}>
                <Text style={styles.penaltyLabel}>Penalty exposure</Text>
                <Text style={styles.penaltyAmount}>INR {(result.penaltyExposure / 100000).toFixed(0)} Lakh</Text>
                <Text style={styles.penaltyNote}>Black Money Act, flat penalty per omission</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={() => navigation.navigate('DTAA', { incomeData, scheduleFAResult: result })} disabled={!canContinue}>
          <Text style={styles.btnText}>Continue to DTAA Check</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  qNote: { ...typography.small, marginBottom: spacing.md, fontStyle: 'italic' },
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  option: { flex: 1, padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgInput, gap: 4 },
  optionSelected: { borderColor: colors.accent, backgroundColor: '#001a0f' },
  optionDanger: { borderColor: colors.danger, backgroundColor: '#1a0000' },
  optionLabel: { ...typography.body, fontWeight: '600' },
  optionLabelSelected: { color: colors.accent },
  optionSub: { ...typography.small },
  subToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  subToggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  resultCard: { ...card, marginTop: spacing.md, borderColor: colors.accent + '30' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  resultTitle: { ...typography.h3 },
  resultSummary: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  penaltyBox: { backgroundColor: '#1a0000', borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.danger },
  penaltyLabel: { ...typography.label, color: colors.danger },
  penaltyAmount: { fontSize: 24, fontWeight: '700', color: colors.danger, marginTop: 4 },
  penaltyNote: { ...typography.small, color: '#ff9999', marginTop: 4 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
});
