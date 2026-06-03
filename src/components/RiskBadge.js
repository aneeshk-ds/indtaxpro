import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../theme';

const RISK_CONFIG = {
  low:      { bg: '#001a0f', border: '#00e5a0', text: '#00e5a0', label: 'LOW RISK' },
  medium:   { bg: '#1a1200', border: '#ffb347', text: '#ffb347', label: 'REVIEW NEEDED' },
  high:     { bg: '#1a0000', border: '#ff4d4d', text: '#ff4d4d', label: 'HIGH RISK' },
  critical: { bg: '#2a0000', border: '#ff1a1a', text: '#ff1a1a', label: 'PENALTY RISK' },
};

export default function RiskBadge({ level = 'low', detail }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  detail: {
    ...typography.small,
    marginTop: 2,
  },
});
