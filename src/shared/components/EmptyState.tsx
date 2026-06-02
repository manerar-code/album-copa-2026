import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@core/theme';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji = '📭', title, subtitle }: EmptyStateProps) {
  return (
    <View style={s.container}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.tx, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: colors.txMut,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
