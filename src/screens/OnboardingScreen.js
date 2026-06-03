import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function OnboardingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>IndTaxPro</Text>
          <Text style={styles.tagline}>
            Indian tax filing for people with complex income.{'\n'}No guesswork, no surprises.
          </Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            onPress={() => navigation.navigate('Main', { screen: 'USFiling', params: { screen: 'IncomeInput' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>$</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>I earn in the US</Text>
              <Text style={styles.cardDesc}>
                RSUs, ESPP, dividends, salary from US company.{'\n'}
                Schedule FA + DTAA + Form 67 check.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Main', { screen: 'IndianTax', params: { screen: 'ITRSelector' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>₹</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>India-only income</Text>
              <Text style={styles.cardDesc}>
                Salary, FD interest, rental income.{'\n'}
                ITR form + regime comparison.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Data stays on your device. Nothing is sent to any server.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  header: { gap: spacing.md },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 24,
  },
  cards: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardPrimary: {
    borderColor: colors.accent,
    backgroundColor: '#001a0f',
  },
  cardIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    width: 36,
    textAlign: 'center',
    marginTop: 2,
  },
  cardText: { flex: 1, gap: 6 },
  cardTitle: { ...typography.h3 },
  cardDesc: { ...typography.small, lineHeight: 18 },
  disclaimer: {
    ...typography.small,
    textAlign: 'center',
    color: colors.muted,
  },
});
