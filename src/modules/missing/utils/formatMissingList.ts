import { getFlagEmoji } from '@shared/utils/flagEmoji';
import type { UserCollection, Selecao, Figurinha } from '@shared/types';

export function formatMissingList(
  collection: UserCollection,
  selecoes: Selecao[],
  figurinhas: Figurinha[],
  albumName: string,
  filterSelecaoId?: string,
): string {
  const lines: string[] = [];
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  lines.push(`${albumName} — Lista de Faltantes`);
  lines.push(`Gerado em: ${day}/${month}/${year}`);
  lines.push('');

  const filteredSelecoes = filterSelecaoId
    ? selecoes.filter(s => s.id === filterSelecaoId)
    : selecoes;

  let totalMissing = 0;

  for (const selecao of filteredSelecoes) {
    const missing = figurinhas
      .filter(f => {
        const status = collection[f.id] ?? 'missing';
        return status === 'missing' && f.selecao_id === selecao.id;
      })
      .sort((a, b) => a.ordem - b.ordem);

    if (missing.length === 0) continue;

    const flagEmoji = getFlagEmoji(selecao.codigo_fifa);
    const label = missing.length === 1 ? 'faltante' : 'faltantes';
    lines.push(`${flagEmoji} ${selecao.nome} (${missing.length} ${label})`);

    for (const f of missing) {
      lines.push(`  #${f.numero} ${f.nome}`);
    }

    lines.push('');
    totalMissing += missing.length;
  }

  const totalLabel = totalMissing === 1 ? 'figurinha faltante' : 'figurinhas faltantes';
  lines.push(`Total: ${totalMissing} ${totalLabel}`);

  return lines.join('\n');
}
