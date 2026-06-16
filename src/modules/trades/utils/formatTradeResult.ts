import { getFlagEmoji } from '@shared/utils/flagEmoji';
import type { Selecao, Figurinha } from '@shared/types';

interface TradeMatch {
  selecao: Selecao;
  figurinhas: Figurinha[];
}

export function formatTradeResult(matches: TradeMatch[], albumName: string): string {
  if (matches.length === 0) {
    return 'Nenhuma figurinha em comum encontrada.';
  }

  const lines: string[] = [];
  lines.push('🤝 Figuras que preciso das suas repetidas:');

  let totalCount = 0;

  for (const { selecao, figurinhas } of matches) {
    const flag = getFlagEmoji(selecao.codigo_fifa);
    const label = flag ? `${flag} ${selecao.nome}` : selecao.nome;
    const numbers = figurinhas.map(f => f.numero).join(', ');
    lines.push(`${label}: ${numbers}`);
    totalCount += figurinhas.length;
  }

  lines.push('');
  lines.push(`Total: ${totalCount} ${totalCount === 1 ? 'figurinha' : 'figurinhas'}`);
  lines.push(`Enviado pelo ${albumName} 📱`);

  return lines.join('\n');
}
