import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, card, radius } from '../theme';

export default function InfoCard({ title, value, subtitle, accent = false }) {
  return (
    <View style={[styles.card, accent && styles.accentCard]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={[styles.value, accent && { color: colors.accent }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    flex: 1,
  },
  accentCard: {
    borderColor: colors.accent,
  },
  title: { ...typography.label, marginBottom: spacing.xs },
  value: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 4 },
});
