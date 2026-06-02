import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '@core/theme';

interface BrandMedallionProps {
  size?: number;
}

export function BrandMedallion({ size = 128 }: BrandMedallionProps) {
  const core = size * 0.72;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* Gold conic-like ring via LinearGradient ring */}
      <LinearGradient
        colors={['#F6D98C', '#E7B43C', '#9A6E1B', '#E7B43C', '#FBE6A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}
      />
      {/* Dark core */}
      <View style={[s.core, { width: core, height: core, borderRadius: core / 2 }]}>
        <Text style={[s.num26, { fontSize: size * 0.3 }]}>26</Text>
        <Text style={[s.futebol, { fontSize: size * 0.072 }]}>FUTEBOL</Text>
      </View>
      {/* Soccer ball accent at top */}
      <Text style={[s.ball, { fontSize: size * 0.1, top: -size * 0.02 }]}>⚽</Text>
    </View>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={s.wordmarkSub}>ÁLBUM OFICIAL</Text>
      <Text style={[s.wordmarkTitle, { fontSize: small ? 30 : 38 }]}>
        COPA <Text style={{ color: colors.gold }}>2026</Text>
      </Text>
    </View>
  );
}

export function GMark() {
  return (
    <View style={s.gmark}>
      <Text style={s.gmarkText}>G</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
  core: {
    backgroundColor: '#0A0F1C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  num26: {
    fontFamily: fonts.display,
    color: colors.goldSoft,
    letterSpacing: -2,
  },
  futebol: {
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.txMut,
  },
  ball: {
    position: 'absolute',
    left: '48%',
  },
  wordmarkSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold,
  },
  wordmarkTitle: {
    fontFamily: fonts.display,
    letterSpacing: -1.2,
    color: colors.tx,
    marginTop: 4,
  },
  gmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a2238',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmarkText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.gold,
  },
});
