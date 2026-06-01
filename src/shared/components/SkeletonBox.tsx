import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '@core/theme';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = radius.sm,
  style,
  testID,
}: SkeletonBoxProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (!enabled) {
        opacity.value = withRepeat(
          withTiming(1.0, { duration: 800 }),
          -1,
          true,
        );
      }
    });
    return () => {
      cancelled = true;
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const staticStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: colors.missing.background,
  } as ViewStyle;

  return (
    <Animated.View
      testID={testID}
      style={[staticStyle, animatedStyle, style]}
    />
  );
}
