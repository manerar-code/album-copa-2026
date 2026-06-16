import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { CromoCard } from '@shared/components/CromoCard';
import { teamFlagEmoji } from '@core/theme';
import { crossPlatformAlert } from '@shared/utils/crossPlatformAlert';

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

export const StickerCard = React.memo(function StickerCard({
  figurinhaId,
  numero,
  descricao,
  codigoFifa,
  f1,
  f2,
  pos,
  width,
}: StickerCardProps) {
  const { toggleSticker, getCrossAlbumDuplicateSources, setStatus, userAlbums, resetSticker } =
    useStickerStore(
      useShallow(s => ({
        toggleSticker: s.toggleSticker,
        getCrossAlbumDuplicateSources: s.getCrossAlbumDuplicateSources,
        setStatus: s.setStatus,
        userAlbums: s.userAlbums,
        resetSticker: s.resetSticker,
      })),
    );

  // Direct subscription to collection[figurinhaId] so the card re-renders on every status change.
  // Using getStatus (a stable fn ref) inside useShallow would NOT trigger re-renders.
  const status = useStickerStore(s => s.collection[figurinhaId] ?? 'missing');
  // Direct subscription to quantities[figurinhaId] so the badge re-renders on every increment.
  const dupCount = useStickerStore(s => s.quantities[figurinhaId] ?? 1);
  const crossAlbumSources = getCrossAlbumDuplicateSources(figurinhaId);
  const isCrossAlbumHighlighted = status === 'missing' && crossAlbumSources.length > 0;
  const flag = codigoFifa ? (teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴') : '🏴';

  // Debounce ref: prevents double-tap within 300ms from firing multiple toggles.
  // The optimistic UI update inside toggleSticker/setStatus is immediate —
  // only the second tap within the window is suppressed.
  const lastTapRef = useRef<number>(0);
  const DEBOUNCE_MS = 300;

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DEBOUNCE_MS) return;
    lastTapRef.current = now;

    if (isCrossAlbumHighlighted) {
      void (async () => {
        await setStatus(figurinhaId, 'owned');
        const sourceNames = crossAlbumSources
          .map(id => userAlbums.find(a => a.id === id)?.name ?? id)
          .join(', ');
        crossPlatformAlert(
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
      })();
    } else {
      void toggleSticker(figurinhaId);
    }
  }, [
    isCrossAlbumHighlighted,
    figurinhaId,
    toggleSticker,
    setStatus,
    crossAlbumSources,
    userAlbums,
    resetSticker,
  ]);

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
      dupCount={status === 'duplicate' ? dupCount : undefined}
      onPressDupBadge={status === 'duplicate' ? () => resetSticker(figurinhaId) : undefined}
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
});
StickerCard.displayName = 'StickerCard';

const styles = StyleSheet.create({
  highlightBorder: {
    borderWidth: 2,
    borderColor: '#E74C3C',
    borderRadius: 8,
  },
});
