import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import Accordion from '../components/Accordion';

const TOPICS = [
  {
    id: 'rsu',
    title: 'RSUs are two taxable events',
    subtitle: 'Vesting is salary, sale is capital gains',
    body: [
      'Vesting is taxed as salary (a perquisite) at the fair market value on the vest date. Your employer should show this in Form 16 Part B, and it goes in the Salary schedule.',
      'Selling the vested shares is a separate capital-gains event. The gain is the sale price minus the vest-date value, and the holding period starts at vesting, not at grant.',
      'Mixing the two, or counting the holding period from the grant date, is the most common mistake and a frequent trigger for a notice.',
    ],
  },
  {
    id: 'foreign',
    title: 'US shares are not Indian equity',
    subtitle: 'Section 112, not 112A or 111A',
    body: [
      'US-listed shares are not on a recognised Indian exchange, so the 112A and 111A rules do not apply to them.',
      'Long term needs more than 24 months of holding, not 12. The rate is 12.5% flat with no indexation.',
      'There is no 1.25 lakh exemption on foreign shares, and short-term gains are added to your income and taxed at your slab rate, not a flat 20%.',
    ],
  },
  {
    id: 'fa',
    title: 'Schedule FA: the three traps',
    subtitle: 'Foreign asset disclosure',
    body: [
      'Period: Schedule FA uses the calendar year (Jan to Dec), not the fiscal year. Statements pulled for Apr to Mar will misreport the first quarter.',
      'Peak value: you report the highest balance reached during the year, not the closing balance on 31 December.',
      'Signing authority: accounts you can sign on but do not own must still be declared. Since 1 October 2024, movable foreign assets under 20 lakh in aggregate are outside the Black Money Act penalty.',
    ],
  },
  {
    id: 'dtaa',
    title: 'DTAA and Form 67',
    subtitle: 'Avoiding double tax on US income',
    body: [
      'Form 67 records the foreign tax you already paid so you can claim it as a credit. Since the 2022 rule change it can be filed up to the end of the assessment year, though filing it early is safer.',
      'For individuals the India-US treaty caps US dividend tax at 25%. The 15% rate applies only to companies that hold at least 10% of the voting stock.',
      'The Foreign Tax Credit is the lower of the Indian tax on that income or the US tax actually paid.',
    ],
  },
  {
    id: 'forex',
    title: 'The exchange-rate rule',
    subtitle: 'SBI TT buying rate',
    body: [
      'Convert every US figure with the State Bank of India Telegraphic Transfer buying rate.',
      'Use the rate for the last day of the month before the income was received. Income in March uses the end-of-February rate.',
      'Using a Google or broker rate can change your reported income and invite a notice.',
    ],
  },
  {
    id: 'regime',
    title: 'Old vs New regime',
    subtitle: 'FY 2025-26',
    body: [
      'The new regime has wider slabs and a 75,000 standard deduction, and tax is nil up to 12 lakh of taxable income after the 87A rebate.',
      'The old regime is usually better only if your deductions (80C, 80D, HRA, home loan interest) are large.',
      'Surcharge in the new regime is capped at 25%. The 37% band applies only under the old regime.',
    ],
  },
];

export default function LearnScreen() {
  const [open, setOpen] = useState('rsu');
  const toggle = (id) => setOpen(open === id ? null : id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          The rules behind the checks, in plain language. Tap a topic to expand it.
        </Text>

        {TOPICS.map(t => (
          <Accordion
            key={t.id}
            title={t.title}
            subtitle={t.subtitle}
            isOpen={open === t.id}
            onToggle={() => toggle(t.id)}
          >
            {t.body.map((p, i) => (
              <Text key={i} style={styles.para}>{p}</Text>
            ))}
          </Accordion>
        ))}

        <Text style={styles.disclaimer}>
          Educational summary only, not tax advice. Confirm any filing with a chartered accountant.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  para: { ...typography.small, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },
  disclaimer: { ...typography.small, color: colors.muted, marginTop: spacing.lg, fontStyle: 'italic' },
});
