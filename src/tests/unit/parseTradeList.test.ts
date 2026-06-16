import { parseTradeList } from '@modules/trades/utils/parseTradeList';

describe('parseTradeList', () => {
  describe('Pass 2 — concatenated format (PREFIX01)', () => {
    it('concatenated uppercase: URU01 URU2 → [{URU,1}, {URU,2}]', () => {
      const result = parseTradeList('URU01 URU2');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries[1]).toEqual({ codigoFifa: 'URU', numero: '2' });
    });

    it('lowercase prefix: uru01 → [{URU,1}]', () => {
      const result = parseTradeList('uru01');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
    });

    it('quantity markers stripped: BRA-12 x3 → [{BRA,12}]', () => {
      const result = parseTradeList('BRA-12 x3');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '12' });
    });
  });

  describe('Pass 1 — section block format (PREFIX: numbers)', () => {
    it('section colon comma: uru: 1, 2 → [{URU,1}, {URU,2}]', () => {
      const result = parseTradeList('uru: 1, 2');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries[1]).toEqual({ codigoFifa: 'URU', numero: '2' });
    });

    it('section colon semicolon: BRA: 3;5;7 → [{BRA,3}, {BRA,5}, {BRA,7}]', () => {
      const result = parseTradeList('BRA: 3;5;7');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map(e => e.numero)).toEqual(['3', '5', '7']);
    });

    it('section colon space-separated: ARG: 1 2 3 → [{ARG,1}, {ARG,2}, {ARG,3}]', () => {
      const result = parseTradeList('ARG: 1 2 3');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
    });
  });

  describe('hasNoPrefix — no valid country code found', () => {
    it('semicolon-only no prefix: 1;2;10 → hasNoPrefix: true, entries: []', () => {
      const result = parseTradeList('1;2;10');
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });

    it('space-only no prefix: 1 2 3 10 → hasNoPrefix: true, entries: []', () => {
      const result = parseTradeList('1 2 3 10');
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });

    it('empty string → entries: [], hasNoPrefix: false, unresolvableCount: 0', () => {
      const result = parseTradeList('');
      expect(result.entries).toHaveLength(0);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.unresolvableCount).toBe(0);
    });
  });

  describe('unknown FIFA prefix — accepted, resolved later by runComparison', () => {
    it('unknown prefix XYZ01 is accepted: entries = [{XYZ,1}], unresolvableCount = 0', () => {
      const result = parseTradeList('XYZ01');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'XYZ', numero: '1' });
      expect(result.unresolvableCount).toBe(0);
    });

    it('code absent from local DB is still accepted: MEX01 MEX02', () => {
      const result = parseTradeList('MEX01 MEX02');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'MEX', numero: '1' });
      expect(result.unresolvableCount).toBe(0);
    });

    it('unknown prefix in section format XYZ: 1, 2 → [{XYZ,1},{XYZ,2}]', () => {
      const result = parseTradeList('XYZ: 1, 2');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'XYZ', numero: '1' });
      expect(result.unresolvableCount).toBe(0);
    });
  });

  describe('quantity marker format — FIFA_CODEnumber (xN)', () => {
    it('FWC6 (x1) → [{FWC,6}], quantity marker ignored', () => {
      const result = parseTradeList('FWC6 (x1)');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'FWC', numero: '6' });
    });

    it('RSA3 (x1), RSA5 (x1), RSA19 (x2) → 3 entries, (x2) does not duplicate', () => {
      const result = parseTradeList('RSA3 (x1), RSA5 (x1), RSA19 (x2)');
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map(e => e.numero)).toEqual(['3', '5', '19']);
    });

    it('(x2) marker does not count sticker twice: URU7 (x2) → 1 entry', () => {
      const result = parseTradeList('URU7 (x2)');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '7' });
    });

    it('full received format with emoji flags, section headers and quantity markers', () => {
      const text =
        '🇲🇽 MEX · pg. 8-9\nMEX6 (x1), MEX10 (x1)\n\n🇿🇦 RSA · pg. 10-11\nRSA3 (x1), RSA19 (x2)';
      const result = parseTradeList(text);
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(4);
      expect(result.entries).toContainEqual({ codigoFifa: 'MEX', numero: '6' });
      expect(result.entries).toContainEqual({ codigoFifa: 'MEX', numero: '10' });
      expect(result.entries).toContainEqual({ codigoFifa: 'RSA', numero: '3' });
      expect(result.entries).toContainEqual({ codigoFifa: 'RSA', numero: '19' });
    });
  });

  describe('deduplication and normalization', () => {
    it('duplicate entries are deduplicated: BRA01 BRA01 → [{BRA,1}]', () => {
      const result = parseTradeList('BRA01 BRA01');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '1' });
    });

    it('leading zeros normalized: BRA001 and BRA1 → single {BRA,1}', () => {
      const result = parseTradeList('BRA001 BRA1');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'BRA', numero: '1' });
    });

    it('case-insensitive prefix: uru: 1 and URU01 → single {URU,1}', () => {
      const result = parseTradeList('uru: 1 URU01');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ codigoFifa: 'URU', numero: '1' });
    });
  });

  describe('conjunction "e" as number separator', () => {
    it('BRA: 9 e 11 → [{BRA,9}, {BRA,11}]', () => {
      const result = parseTradeList('BRA: 9 e 11');
      expect(result.entries).toHaveLength(2);
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '9' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '11' });
    });

    it('CRO: 4, 17 e 20 → [{CRO,4}, {CRO,17}, {CRO,20}]', () => {
      const result = parseTradeList('CRO: 4, 17 e 20');
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map(e => e.numero)).toEqual(['4', '17', '20']);
    });

    it('uppercase E (as typed in modal): BRA: 9 E 11 → 2 entries', () => {
      const result = parseTradeList('BRA: 9 E 11');
      expect(result.entries).toHaveLength(2);
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '9' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '11' });
    });

    it('multiple "e" separators: URU: 1 e 3 e 5 → 3 entries', () => {
      const result = parseTradeList('URU: 1 e 3 e 5');
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map(e => e.numero)).toEqual(['1', '3', '5']);
    });

    it('does not affect FIFA prefix starting with E: ESP: 1, 2 → 2 entries', () => {
      const result = parseTradeList('ESP: 1, 2');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ codigoFifa: 'ESP', numero: '1' });
    });

    it('mixed sections with "e": BRA: 9 e 11 CRO: 4, 17 e 20 → 5 entries', () => {
      const result = parseTradeList('BRA: 9 e 11 CRO: 4, 17 e 20');
      expect(result.entries).toHaveLength(5);
      expect(result.entries.filter(e => e.codigoFifa === 'BRA')).toHaveLength(2);
      expect(result.entries.filter(e => e.codigoFifa === 'CRO')).toHaveLength(3);
    });
  });

  describe('mixed formats', () => {
    it('mixed formats in same text: URU01 bra: 3, 4 → 3 entries for URU and BRA', () => {
      const result = parseTradeList('URU01 bra: 3, 4');
      expect(result.hasNoPrefix).toBe(false);
      expect(result.entries).toHaveLength(3);
      expect(result.entries).toContainEqual({ codigoFifa: 'URU', numero: '1' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '3' });
      expect(result.entries).toContainEqual({ codigoFifa: 'BRA', numero: '4' });
    });

    it('multiple selecoes in one paste', () => {
      const result = parseTradeList('BRA: 1, 2\nARG: 7\nURU01 URU02');
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
    it('parseTradeList("URU01 URU2") returns 2 entries with hasNoPrefix: false', () => {
      const result = parseTradeList('URU01 URU2');
      expect(result.entries).toHaveLength(2);
      expect(result.hasNoPrefix).toBe(false);
    });

    it('parseTradeList("1 2 3") returns hasNoPrefix: true with empty entries', () => {
      const result = parseTradeList('1 2 3');
      expect(result.hasNoPrefix).toBe(true);
      expect(result.entries).toHaveLength(0);
    });
  });
});
