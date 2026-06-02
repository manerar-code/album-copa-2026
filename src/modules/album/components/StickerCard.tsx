import React from 'react';
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
  const { toggleSticker, getStatus } = useStickerStore();
  const status = getStatus(figurinhaId);
  const flag = codigoFifa ? (teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴') : '🏴';

  return (
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
      onPress={() => toggleSticker(figurinhaId)}
    />
  );
}
