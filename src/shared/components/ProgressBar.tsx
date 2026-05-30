import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@app/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  height = 10,
  color = colors.secondary,
  backgroundColor = '#F0F0F0',
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.container, { height, backgroundColor, borderRadius: radius.full }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
