import type { ParsedEntry } from '@modules/trades/utils/parseTradeList';
import type { Figurinha, Selecao } from '@shared/types';

export function resolveEntries(
  entries: ParsedEntry[],
  figurinhas: Figurinha[],
  selecoes: Selecao[],
): string[] {
  if (entries.length === 0) return [];

  const selecaoByFifa = new Map<string, string>();
  for (const sel of selecoes) {
    selecaoByFifa.set(sel.codigo_fifa.toUpperCase(), sel.id);
  }

  const figurinhaByKey = new Map<string, string>();
  for (const fig of figurinhas) {
    const n = parseInt(fig.numero, 10);
    if (!isNaN(n)) {
      figurinhaByKey.set(`${fig.selecao_id}:${n}`, fig.id);
    }
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const selecaoId = selecaoByFifa.get(entry.codigoFifa.toUpperCase());
    if (!selecaoId) continue;

    const n = parseInt(entry.numero, 10);
    if (isNaN(n)) continue;

    const figurinhaId = figurinhaByKey.get(`${selecaoId}:${n}`);
    if (!figurinhaId) continue;

    if (!seen.has(figurinhaId)) {
      seen.add(figurinhaId);
      result.push(figurinhaId);
    }
  }

  return result;
}
