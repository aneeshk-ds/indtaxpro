import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

/**
 * Collapsible section. Controlled by the parent so only one can be open at a time.
 * Props: title, subtitle, isOpen, onToggle, badge (optional node), children, done (optional bool)
 */
export default function Accordion({ title, subtitle, isOpen, onToggle, badge, children, done }) {
  return (
    <View style={[styles.wrap, isOpen && styles.wrapOpen]}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.dotWrap}>
          <View style={[styles.dot, done && styles.dotDone, isOpen && styles.dotOpen]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? <View style={styles.badge}>{badge}</View> : null}
        <Text style={[styles.chevron, isOpen && styles.chevronOpen]}>{isOpen ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  wrapOpen: { borderColor: colors.accent },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  dotWrap: { width: 14, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.muted },
  dotOpen: { borderColor: colors.accent },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  headerText: { flex: 1 },
  title: { ...typography.body, fontWeight: '600' },
  subtitle: { ...typography.small, marginTop: 2 },
  badge: { marginRight: spacing.xs },
  chevron: { color: colors.muted, fontSize: 14, width: 16, textAlign: 'center' },
  chevronOpen: { color: colors.accent },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
