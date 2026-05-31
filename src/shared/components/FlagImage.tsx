import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@core/theme';

// Ícones para seções especiais (não-países)
const SPECIAL_ICONS: Record<string, { emoji: string; bg: string }> = {
  FWC: { emoji: '🏆', bg: '#1A3A6C' },
  PAW: { emoji: '🎴', bg: '#6B2D8B' },
  HCC: { emoji: '🌎', bg: '#0A6640' },
  FWH: { emoji: '📖', bg: '#8B1A1A' },
};

interface FlagImageProps {
  codigoFifa: string;
  bandeiraUrl?: string;
  size?: number;
}

export function FlagImage({ codigoFifa, bandeiraUrl, size = 28 }: FlagImageProps) {
  const code = codigoFifa.toUpperCase();

  // Seções especiais — exibe ícone customizado
  const special = SPECIAL_ICONS[code];
  if (special) {
    return (
      <View
        style={[
          styles.special,
          {
            width: size * 1.4,
            height: size,
            backgroundColor: special.bg,
            borderRadius: radius.sm / 2,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.55 }}>{special.emoji}</Text>
      </View>
    );
  }

  // Usa bandeira_url do banco quando disponível
  const url = bandeiraUrl || '';

  if (!url) {
    // Fallback: iniciais do código
    return (
      <View style={[styles.fallback, { width: size * 1.4, height: size }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.38 }]}>
          {codigoFifa.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[styles.flag, { width: size * 1.4, height: size }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  flag: { borderRadius: 3 },
  special: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    borderRadius: 3,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { fontWeight: '800', color: colors.textSecondary },
});
