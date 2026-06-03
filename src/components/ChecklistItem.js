import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function ChecklistItem({ text, passed, note }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.icon, { color: passed ? colors.accent : colors.danger }]}>
        {passed ? '✓' : '✗'}
      </Text>
      <View style={styles.content}>
        <Text style={[styles.text, { color: passed ? colors.text : colors.danger }]}>{text}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    marginTop: 1,
    width: 18,
  },
  content: { flex: 1 },
  text: { ...typography.body },
  note: { ...typography.small, marginTop: 2 },
});
