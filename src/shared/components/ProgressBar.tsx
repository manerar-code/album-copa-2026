import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@core/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  color = colors.gold,
  backgroundColor = 'rgba(255,255,255,0.08)',
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[s.container, { height, backgroundColor, borderRadius: radius.full }]}>
      <View
        style={[
          s.fill,
          {
            width: `${Math.max(2, clampedProgress * 100)}%`,
            backgroundColor: clampedProgress >= 1 ? colors.green : color,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
