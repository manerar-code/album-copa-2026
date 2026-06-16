import { resolveEntries } from '@modules/duplicates/utils/resolveEntries';
import type { Figurinha, Selecao } from '@shared/types';
import type { ParsedEntry } from '@modules/trades/utils/parseTradeList';

const BRA: Selecao = {
  id: 'sel-bra',
  album_id: 'album-1',
  nome: 'Brasil',
  codigo_fifa: 'BRA',
  ordem: 1,
  bandeira_url: '',
};

const URU: Selecao = {
  id: 'sel-uru',
  album_id: 'album-1',
  nome: 'Uruguai',
  codigo_fifa: 'URU',
  ordem: 2,
  bandeira_url: '',
};

const selecoes: Selecao[] = [BRA, URU];

const figurinhas: Figurinha[] = [
  {
    id: 'fig-bra-1',
    album_id: 'album-1',
    selecao_id: 'sel-bra',
    numero: '1',
    nome: 'Neymar',
    type: 'player',
    descricao: '',
    ordem: 1,
  },
  {
    id: 'fig-bra-2',
    album_id: 'album-1',
    selecao_id: 'sel-bra',
    numero: '2',
    nome: 'Vinicius',
    type: 'player',
    descricao: '',
    ordem: 2,
  },
  {
    id: 'fig-uru-1',
    album_id: 'album-1',
    selecao_id: 'sel-uru',
    numero: '1',
    nome: 'Suarez',
    type: 'player',
    descricao: '',
    ordem: 1,
  },
];

describe('resolveEntries', () => {
  it('returns figurinha IDs for valid entries', () => {
    const entries: ParsedEntry[] = [
      { codigoFifa: 'BRA', numero: '1' },
      { codigoFifa: 'URU', numero: '1' },
    ];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual(['fig-bra-1', 'fig-uru-1']);
  });

  it('returns empty array when entries is empty', () => {
    expect(resolveEntries([], figurinhas, selecoes)).toEqual([]);
  });

  it('skips unknown codigoFifa silently without throwing', () => {
    const entries: ParsedEntry[] = [{ codigoFifa: 'ZZZ', numero: '1' }];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual([]);
  });

  it('skips unknown numero silently without throwing', () => {
    const entries: ParsedEntry[] = [{ codigoFifa: 'BRA', numero: '9999' }];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual([]);
  });

  it('resolves "01" (leading zero) to the same sticker as "1"', () => {
    const entries: ParsedEntry[] = [{ codigoFifa: 'BRA', numero: '01' }];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual(['fig-bra-1']);
  });

  it('deduplicates: two entries pointing to the same sticker yield one ID', () => {
    const entries: ParsedEntry[] = [
      { codigoFifa: 'BRA', numero: '1' },
      { codigoFifa: 'BRA', numero: '01' },
    ];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual(['fig-bra-1']);
  });

  it('does not cross-resolve: BRA:1 and URU:1 are different stickers', () => {
    const entries: ParsedEntry[] = [
      { codigoFifa: 'BRA', numero: '1' },
      { codigoFifa: 'URU', numero: '1' },
    ];
    const result = resolveEntries(entries, figurinhas, selecoes);
    expect(result).toHaveLength(2);
    expect(result).toContain('fig-bra-1');
    expect(result).toContain('fig-uru-1');
  });

  it('is case-insensitive for codigoFifa', () => {
    const entries: ParsedEntry[] = [{ codigoFifa: 'bra', numero: '2' }];
    expect(resolveEntries(entries, figurinhas, selecoes)).toEqual(['fig-bra-2']);
  });
});
