import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { colors, radius } from '@core/theme';
import type { StickerStatus } from '@shared/types';

const stateStyles: Record<StickerStatus, { background: string; text: string; border?: string }> = {
  missing: { background: colors.missing.background, text: colors.missing.text },
  owned: {
    background: colors.owned.background,
    text: colors.owned.text,
    border: colors.owned.border,
  },
  duplicate: {
    background: colors.duplicate.background,
    text: colors.duplicate.text,
    border: colors.duplicate.border,
  },
};

interface StickerCardProps {
  figurinhaId: string;
  numero: string;
  descricao?: string;
}

export function StickerCard({ figurinhaId, numero, descricao }: StickerCardProps) {
  const { toggleSticker, getStatus, getTradeSource } = useStickerStore();
  const status = getStatus(figurinhaId);
  const style = stateStyles[status];
  const tradeSource = getTradeSource(figurinhaId);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: style.background },
        style.border ? { borderWidth: 2, borderColor: style.border } : null,
        tradeSource ? styles.tradeBorder : null,
      ]}
      onPress={() => toggleSticker(figurinhaId)}
      activeOpacity={0.7}
    >
      <Text style={[styles.number, { color: style.text }]}>{numero}</Text>
      {!!descricao && (
        <Text style={[styles.descricao, { color: style.text }]} numberOfLines={2}>
          {descricao}
        </Text>
      )}
      {tradeSource && (
        <Text style={styles.tradeIcon}>🔴</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  number: { fontSize: 12, fontWeight: '800' },
  descricao: { fontSize: 8, fontWeight: '500', textAlign: 'center', marginTop: 2, opacity: 0.85 },
  tradeBorder: { borderWidth: 2, borderColor: colors.error },
  tradeIcon: { fontSize: 7, position: 'absolute', top: 1, right: 1 },
});
