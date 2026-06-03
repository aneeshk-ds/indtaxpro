import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';

const ITR_FORMS = {
  'ITR-1': {
    name: 'ITR-1 (Sahaj)',
    for: 'Salaried individuals with income up to INR 50L',
    sources: 'Salary, one house property, other sources (interest)',
    notFor: 'Business income, capital gains, foreign income, more than one house',
  },
  'ITR-2': {
    name: 'ITR-2',
    for: 'Individuals with capital gains or multiple house properties',
    sources: 'Salary, house property, capital gains, foreign income',
    notFor: 'Business or professional income',
  },
  'ITR-3': {
    name: 'ITR-3',
    for: 'Individuals with business or professional income',
    sources: 'Business income, salary, capital gains, house property',
    notFor: 'Presumptive taxation (use ITR-4)',
  },
  'ITR-4': {
    name: 'ITR-4 (Sugam)',
    for: 'Presumptive taxation scheme (Sec 44AD / 44ADA / 44AE)',
    sources: 'Business income under presumptive scheme, salary, one house property',
    notFor: 'Capital gains, foreign income, income > INR 50L from other sources',
  },
};

export default function ITRSelectorScreen({ navigation }) {
  const [profile, setProfile] = useState({
    hasSalary: false,
    hasBusinessIncome: false,
    hasCapitalGains: false,
    hasHouseProperty: false,
    multipleHouseProperty: false,
    hasForeignIncome: false,
    hasPresumptive: false,
    totalIncomeAbove50L: false,
  });

  const set = (key, val) => setProfile(prev => ({ ...prev, [key]: val }));

  const recommendForm = () => {
    if (profile.hasForeignIncome) return 'ITR-2';
    if (profile.hasBusinessIncome && !profile.hasPresumptive) return 'ITR-3';
    if (profile.hasPresumptive) return 'ITR-4';
    if (profile.hasCapitalGains || profile.multipleHouseProperty) return 'ITR-2';
    return 'ITR-1';
  };

  const recommended = recommendForm();
  const formInfo = ITR_FORMS[recommended];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          Answer what income sources apply to you. The correct ITR form is determined automatically.
        </Text>

        {[
          { key: 'hasSalary', label: 'Salary or pension income' },
          { key: 'hasCapitalGains', label: 'Capital gains (stocks, MF, property)' },
          { key: 'hasHouseProperty', label: 'Rental income or house property' },
          { key: 'multipleHouseProperty', label: 'More than one house property' },
          { key: 'hasForeignIncome', label: 'Foreign income or foreign assets' },
          { key: 'hasBusinessIncome', label: 'Business or professional income' },
          { key: 'hasPresumptive', label: 'Opting for presumptive taxation (44AD/44ADA)' },
          { key: 'totalIncomeAbove50L', label: 'Total income above INR 50 Lakh' },
        ].map(item => (
          <View key={item.key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{item.label}</Text>
            <Switch
              value={profile[item.key]}
              onValueChange={v => set(item.key, v)}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.text}
            />
          </View>
        ))}

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Recommended form</Text>
          <Text style={styles.resultForm}>{formInfo.name}</Text>
          <View style={styles.divider} />
          <Text style={styles.detailLabel}>Suitable for</Text>
          <Text style={styles.detailText}>{formInfo.for}</Text>
          <Text style={styles.detailLabel}>Income sources covered</Text>
          <Text style={styles.detailText}>{formInfo.sources}</Text>
          <Text style={styles.detailLabel}>NOT suitable if</Text>
          <Text style={styles.detailText}>{formInfo.notFor}</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('RegimeComparator')}
        >
          <Text style={styles.btnText}>Compare Old vs New Regime</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  resultCard: { ...card, marginTop: spacing.xl },
  resultLabel: { ...typography.label },
  resultForm: { fontSize: 26, fontWeight: '800', color: colors.accent, marginTop: 4, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  detailLabel: { ...typography.label, marginBottom: 4 },
  detailText: { ...typography.small, lineHeight: 20, marginBottom: spacing.md },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
});
