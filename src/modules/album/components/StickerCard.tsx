import React from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { CromoCard } from '@shared/components/CromoCard';
import { teamFlagEmoji } from '@core/theme';

interface StickerCardProps {
  figurinhaId: string;
  numero: string;
  descricao?: string;
  /** FIFA code (MEX, BRA…) — used to resolve the flag emoji */
  codigoFifa?: string;
  /** Team gradient color 1 */
  f1?: string;
  /** Team gradient color 2 */
  f2?: string;
  /** Sticker position label (ATA, GOL, etc.) */
  pos?: string;
  /** Card width — height = w × 1.31 */
  width?: number;
}

export function StickerCard({
  figurinhaId,
  numero,
  descricao,
  codigoFifa,
  f1,
  f2,
  pos,
  width,
}: StickerCardProps) {
  const { toggleSticker, getStatus, getCrossAlbumDuplicateSources, setStatus, userAlbums } =
    useStickerStore();

  const status = getStatus(figurinhaId);
  const crossAlbumSources = getCrossAlbumDuplicateSources(figurinhaId);
  const isCrossAlbumHighlighted = status === 'missing' && crossAlbumSources.length > 0;
  const flag = codigoFifa ? (teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴') : '🏴';

  const handlePress = isCrossAlbumHighlighted
    ? async () => {
        await setStatus(figurinhaId, 'owned');
        const sourceNames = crossAlbumSources
          .map(id => userAlbums.find(a => a.id === id)?.name ?? id)
          .join(', ');
        Alert.alert(
          'Atualizar coleção',
          `Esta figurinha está repetida em ${sourceNames}. Deseja marcá-la como "tenho" lá também?`,
          [
            { text: 'Não', style: 'cancel' },
            {
              text: 'Sim',
              onPress: async () => {
                for (const sourceId of crossAlbumSources) {
                  await setStatus(figurinhaId, 'owned', sourceId);
                }
              },
            },
          ],
        );
      }
    : () => toggleSticker(figurinhaId);

  const card = (
    <CromoCard
      figurinhaId={figurinhaId}
      numero={numero}
      descricao={descricao}
      pos={pos}
      flag={flag}
      f1={f1}
      f2={f2}
      state={status}
      width={width}
      onPress={handlePress}
    />
  );

  if (isCrossAlbumHighlighted) {
    return (
      <View style={styles.highlightBorder} testID="cross-album-highlight">
        {card}
      </View>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  highlightBorder: {
    borderWidth: 2,
    borderColor: '#E74C3C',
    borderRadius: 8,
  },
});
