import { parseTradeList } from '@modules/trades/utils/parseTradeList';
import type { Selecao } from '@shared/types';

const MOCK_SELECAO_URU: Selecao = {
  id: 'sel-uru',
  album_id: 'album-1',
  nome: 'Uruguai',
  codigo_fifa: 'URU',
  ordem: 1,
  bandeira_url: '',
};

const MOCK_SELECAO_BRA: Selecao = {
  id: 'sel-bra',
  album_id: 'album-1',
  nome: 'Brasil',
  codigo_fifa: 'BRA',
  ordem: 2,
  bandeira_url: '',
};

const MOCK_SELECAO_ARG: Selecao = {
  id: 'sel-arg',
  album_id: 'album-1',
  nome: 'Argentina',
  codigo_fifa: 'ARG',
  ordem: 3,
  bandeira_url: '',
};

const ALL_SELECOES = [MOCK_SELECAO_URU, MOCK_SELECAO_BRA, MOCK_SELECAO_ARG];

describe('parseTradeList', () => {
  describe('Pass 2 — concatenated format (PREFIX01)', () => {
    it('concatenated uppercase: URU01 URU2 → [{URU,1}, {URU,2}]', () => {
      const result = parseTradeList('URU01 URU2', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries[1]).toEqual({ codigoFifa: 'URU', numero: '2' });
    });

    it('lowercase prefix: uru01 → [{URU,1}]', () => {
      const result = parseTradeList('uru01', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
    });

    it('quantity markers stripped: BRA-12 x3 → [{BRA,12}]', () => {
      const result = parseTradeList('BRA-12 x3', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '12' });
    });
  });

  describe('Pass 1 — section block format (PREFIX: numbers)', () => {
    it('section colon comma: uru: 1, 2 → [{URU,1}, {URU,2}]', () => {
      const result = parseTradeList('uru: 1, 2', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries[1]).toEqual({ codigoFifa: 'URU', numero: '2' });
    });

    it('section colon semicolon: BRA: 3;5;7 → [{BRA,3}, {BRA,5}, {BRA,7}]', () => {
      const result = parseTradeList('BRA: 3;5;7', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map(e => e.numero)).toEqual(['3', '5', '7']);
    });

    it('section colon space-separated: ARG: 1 2 3 → [{ARG,1}, {ARG,2}, {ARG,3}]', () => {
      const result = parseTradeList('ARG: 1 2 3', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
    });
  });

  describe('hasNoPrefix — no valid country code found', () => {
    it('semicolon-only no prefix: 1;2;10 → hasNoPrefix: true, entries: []', () => {
      const result = parseTradeList('1;2;10', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });

    it('space-only no prefix: 1 2 3 10 → hasNoPrefix: true, entries: []', () => {
      const result = parseTradeList('1 2 3 10', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });

    it('empty string → entries: [], hasNoPrefix: false, unresolvableCount: 0', () => {
      const result = parseTradeList('', ALL_SELECOES);
      expect(result.entries).toHaveLength(0);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.unresolvableCount).toBe(0);
    });
  });

  describe('unresolvableCount — invalid FIFA prefix', () => {
    it('invalid FIFA prefix XYZ01 → unresolvableCount: 1, entries: []', () => {
      const result = parseTradeList('XYZ01', ALL_SELECOES);
      expect(result.entries).toHaveLength(0);
      expect(result.unresolvableCount).toBe(1);
    });

    it('FIFA code not in selecoes allowlist is counted as unresolvable', () => {
      const result = parseTradeList('MEX01 MEX02', [MOCK_SELECAO_BRA]); // MEX not in allowlist
      expect(result.entries).toHaveLength(0);
      expect(result.unresolvableCount).toBe(2);
    });

    it('invalid prefix in section format (XYZ: 1, 2) counted as unresolvable', () => {
      const result = parseTradeList('XYZ: 1, 2', [MOCK_SELECAO_BRA]); // XYZ not in allowlist
      expect(result.entries).toHaveLength(0);
      expect(result.unresolvableCount).toBe(2);
    });
  });

  describe('deduplication and normalization', () => {
    it('duplicate entries are deduplicated: BRA01 BRA01 → [{BRA,1}]', () => {
      const result = parseTradeList('BRA01 BRA01', ALL_SELECOES);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '1' });
    });

    it('leading zeros normalized: BRA001 and BRA1 → single {BRA,1}', () => {
      const result = parseTradeList('BRA001 BRA1', ALL_SELECOES);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '1' });
    });

    it('case-insensitive prefix: uru: 1 and URU01 → single {URU,1}', () => {
      const result = parseTradeList('uru: 1 URU01', ALL_SELECOES);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
    });
  });

  describe('mixed formats', () => {
    it('mixed formats in same text: URU01 bra: 3, 4 → 3 entries for URU and BRA', () => {
      const result = parseTradeList('URU01 bra: 3, 4', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
      expect(result.entries).toContainEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '3' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '4' });
    });

    it('multiple selecoes in one paste', () => {
      const result = parseTradeList('BRA: 1, 2\nARG: 7\nURU01 URU02', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(5);
      const bra = result.entries.filter(e => e.codigoFifa === 'BRA');
      const arg = result.entries.filter(e => e.codigoFifa === 'ARG');
      const uru = result.entries.filter(e => e.codigoFifa === 'URU');
      expect(bra).toHaveLength(2);
      expect(arg).toHaveLength(1);
      expect(uru).toHaveLength(2);
    });
  });

  describe('success criteria', () => {
    it('parseTradeList("URU01 URU2", selecoes) returns 2 entries with hasNoPrefix: false', () => {
      const result = parseTradeList('URU01 URU2', ALL_SELECOES);
      expect(result.entries).toHaveLength(2);
      expect(result.hasNoPrefix).toBe(false);
    });

    it('parseTradeList("1 2 3", selecoes) returns hasNoPrefix: true with empty entries', () => {
      const result = parseTradeList('1 2 3', ALL_SELECOES);
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });
  });
});
