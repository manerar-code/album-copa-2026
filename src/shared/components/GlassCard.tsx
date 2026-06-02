import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius } from '@core/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the gold-tinted variant */
  gold?: boolean;
}

export function GlassCard({ children, style, gold }: GlassCardProps) {
  return <View style={[s.card, gold && s.cardGold, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.glass,
  },
  cardGold: {
    backgroundColor: 'rgba(231,180,60,0.08)',
    borderColor: 'rgba(231,180,60,0.22)',
  },
});
