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

  // DB stores numero as "{codigoFifa}{number}" (e.g. "BRA1", "ARG10")
  const figurinhaByKey = new Map<string, string>();
  // CC variant stickers (CC-LAM10, CC-US4, CC-RW14) have no selecao FIFA code — index by numero directly
  const ccFigurinhaByNumero = new Map<string, string>();
  for (const fig of figurinhas) {
    figurinhaByKey.set(`${fig.selecao_id}:${fig.numero}`, fig.id);
    if (fig.numero.startsWith('CC-')) {
      ccFigurinhaByNumero.set(fig.numero, fig.id);
    }
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    let figurinhaId: string | undefined;

    if (entry.codigoFifa.startsWith('CC-')) {
      // CC variant: codigoFifa = "CC-LAM", numero = "10" → expectedNumero = "CC-LAM10"
      const expectedNumero = `${entry.codigoFifa}${entry.numero}`;
      figurinhaId = ccFigurinhaByNumero.get(expectedNumero);
    } else {
      const selecaoId = selecaoByFifa.get(entry.codigoFifa.toUpperCase());
      if (!selecaoId) continue;
      const expectedNumero = `${entry.codigoFifa.toUpperCase()}${entry.numero}`;
      figurinhaId = figurinhaByKey.get(`${selecaoId}:${expectedNumero}`);
    }

    if (!figurinhaId) continue;

    if (!seen.has(figurinhaId)) {
      seen.add(figurinhaId);
      result.push(figurinhaId);
    }
  }

  return result;
}
