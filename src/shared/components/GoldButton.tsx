import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius, shadows } from '@core/theme';

interface GoldButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Use ghost variant (dark outline, no fill) */
  ghost?: boolean;
}

export function GoldButton({ label, onPress, loading, disabled, style, ghost }: GoldButtonProps) {
  if (ghost) {
    return (
      <TouchableOpacity
        style={[s.ghost, (disabled || loading) && s.disabled, style]}
        onPress={onPress}
        activeOpacity={0.75}
        disabled={disabled || loading}
      >
        <Text style={s.ghostText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[(disabled || loading) && s.disabled, style]}
    >
      <LinearGradient
        colors={gradients.goldBtn.colors}
        start={gradients.goldBtn.start}
        end={gradients.goldBtn.end}
        style={[s.btn, shadows.goldBtn]}
      >
        {loading ? (
          <ActivityIndicator color={colors.ink900} />
        ) : (
          <Text style={s.label}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: radius.btn,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: '#2a1c02',
    letterSpacing: 0.2,
  },
  ghost: {
    borderRadius: radius.btn,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 46,
  },
  ghostText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tx,
  },
  disabled: { opacity: 0.55 },
});
