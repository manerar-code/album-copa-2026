import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { colors, radius } from '@app/theme';
import type { StickerStatus } from '@shared/types';

const stateStyles: Record<StickerStatus, { background: string; text: string; border?: string }> = {
  missing: { background: colors.missing.background, text: colors.missing.text },
  owned: { background: colors.owned.background, text: colors.owned.text, border: colors.owned.border },
  duplicate: { background: colors.duplicate.background, text: colors.duplicate.text, border: colors.duplicate.border },
};

interface StickerCardProps {
  figurinhaId: string;
  numero: string;
}

export function StickerCard({ figurinhaId, numero }: StickerCardProps) {
  const { toggleSticker, getStatus } = useStickerStore();
  const status = getStatus(figurinhaId);
  const style = stateStyles[status];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: style.background },
        style.border ? { borderWidth: 2, borderColor: style.border } : null,
      ]}
      onPress={() => toggleSticker(figurinhaId)}
      activeOpacity={0.7}
    >
      <Text style={[styles.number, { color: style.text }]}>{numero}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 12, fontWeight: '800' },
});
