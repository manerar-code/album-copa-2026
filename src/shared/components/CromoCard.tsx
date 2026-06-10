import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius } from '@core/theme';
import type { StickerStatus } from '@shared/types';

export interface CromoCardProps {
  figurinhaId?: string;
  numero: string;
  descricao?: string;
  pos?: string;
  flag?: string;
  /** Team field gradient color 1 */
  f1?: string;
  /** Team field gradient color 2 */
  f2?: string;
  state?: StickerStatus;
  /** Duplicate count (shown as ×N badge) */
  dupCount?: number;
  /** Card width in px — height = w × 1.31 */
  width?: number;
  onPress?: () => void;
}

const W_DEFAULT = 72;

export function CromoCard({
  numero,
  descricao,
  pos = '',
  flag = '🏴',
  f1 = '#1A3A6C',
  f2 = '#0A2342',
  state = 'missing',
  dupCount = 0,
  width = W_DEFAULT,
  onPress,
}: CromoCardProps) {
  const h = Math.round(width * 1.31);
  const isMissing = state === 'missing';
  const isDup = state === 'duplicate';

  const inner = (
    <View style={[s.inner, { borderRadius: radius.cromoInner, overflow: 'hidden' }]}>
      {isMissing ? (
        <View
          style={[
            s.innerField,
            { backgroundColor: colors.missing.background, borderRadius: radius.cromoInner },
          ]}
        >
          {/* Ghost number watermark */}
          <Text style={[s.numWatermark, { fontSize: width * 0.75, opacity: 0.05, color: '#fff' }]}>
            {numero}
          </Text>
          {/* Top row */}
          <View style={s.topRow}>
            {!!pos && (
              <View style={s.posChip}>
                <Text style={[s.posText, { fontSize: width * 0.085 }]}>{pos}</Text>
              </View>
            )}
            <Text style={[s.flagText, { fontSize: width * 0.18 }]}>{flag}</Text>
          </View>
          {/* Plus sign */}
          <Text style={[s.plusSign, { fontSize: width * 0.38 }]}>+</Text>
          {/* Name plate */}
          <View style={s.plate}>
            <Text
              style={[s.plateName, { fontSize: width * 0.11, color: colors.txFaint }]}
              numberOfLines={1}
            >
              {descricao ?? `#${numero}`}
            </Text>
            <Text style={[s.plateSub, { fontSize: width * 0.085, color: colors.txFaint }]}>
              #{numero}
              {pos ? ` · ${pos}` : ''}
            </Text>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[f1, f2]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[s.innerField, { borderRadius: radius.cromoInner }]}
        >
          {/* Number watermark */}
          <Text
            style={[s.numWatermark, { fontSize: width * 0.75, color: 'rgba(255,255,255,0.12)' }]}
          >
            {numero}
          </Text>
          {/* Top row */}
          <View style={s.topRow}>
            {!!pos && (
              <View style={s.posChip}>
                <Text style={[s.posText, { fontSize: width * 0.085 }]}>{pos}</Text>
              </View>
            )}
            <Text style={[s.flagText, { fontSize: width * 0.18 }]}>{flag}</Text>
          </View>
          {/* Name plate */}
          <LinearGradient
            colors={['transparent', 'rgba(7,12,22,0.78)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.plate}
          >
            <Text style={[s.plateName, { fontSize: width * 0.11 }]} numberOfLines={1}>
              {descricao ?? `#${numero}`}
            </Text>
            <Text style={[s.plateSub, { fontSize: width * 0.085, color: colors.goldSoft }]}>
              #{numero}
              {pos ? ` · ${pos}` : ''}
            </Text>
          </LinearGradient>
        </LinearGradient>
      )}
    </View>
  );

  const cardContent = isMissing ? (
    <View
      testID="cromo-missing"
      style={[s.outerMissing, { width, height: h, borderRadius: radius.cromo }]}
    >
      {inner}
    </View>
  ) : isDup ? (
    <LinearGradient
      testID="cromo-duplicate"
      colors={gradients.cromoGold.colors}
      start={gradients.cromoGold.start}
      end={gradients.cromoGold.end}
      style={[s.outerDup, { width, height: h, borderRadius: radius.cromo }]}
    >
      {inner}
      {/* Duplicate badge ×N */}
      {dupCount > 1 && (
        <LinearGradient
          colors={[colors.goldSoft, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.dupBadge}
        >
          <Text style={[s.dupBadgeText, { fontSize: width * 0.11 }]}>×{dupCount}</Text>
        </LinearGradient>
      )}
    </LinearGradient>
  ) : (
    /* owned — plain View, green border, no check icon */
    <View
      testID="cromo-owned"
      style={[s.outerOwned, { width, height: h, borderRadius: radius.cromo }]}
    >
      {inner}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {cardContent}
      </TouchableOpacity>
    );
  }
  return cardContent;
}

const s = StyleSheet.create({
  outerDup: {
    padding: 2.5,
  },
  outerOwned: {
    borderWidth: 2.5,
    borderColor: colors.owned.border,
  },
  outerMissing: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(231,180,60,0.32)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inner: {
    flex: 1,
  },
  innerField: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  numWatermark: {
    position: 'absolute',
    bottom: -12,
    right: -6,
    fontWeight: '900',
    lineHeight: undefined,
  },
  topRow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posChip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  posText: {
    color: '#fff',
    fontFamily: fonts.mono,
  },
  flagText: {
    lineHeight: undefined,
  },
  plusSign: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
    color: 'rgba(231,180,60,0.42)',
    fontWeight: '300',
    lineHeight: undefined,
  },
  plate: {
    paddingHorizontal: 5,
    paddingBottom: 5,
    paddingTop: 8,
  },
  plateName: {
    fontFamily: fonts.display,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  plateSub: {
    fontFamily: fonts.mono,
    marginTop: 1,
  },
  dupBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dupBadgeText: {
    fontFamily: fonts.display,
    color: '#2a1c02',
  },
});
