import { formatTradeResult } from '@modules/trades/utils/formatTradeResult';
import type { Selecao, Figurinha } from '@shared/types';

const ALBUM_NAME = 'Álbum Copa 2026';

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

const makeFig = (id: string, selecaoId: string, numero: string, nome: string): Figurinha => ({
  id,
  album_id: 'album-1',
  selecao_id: selecaoId,
  numero,
  nome,
  type: 'Player',
  descricao: '',
  ordem: 1,
});

describe('formatTradeResult', () => {
  describe('header', () => {
    it('output contains the 🤝 header line', () => {
      const matches = [
        { selecao: MOCK_SELECAO_BRA, figurinhas: [makeFig('f1', 'sel-bra', '7', 'Neymar')] },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('🤝 Figuras que preciso das suas repetidas:');
    });
  });

  describe('team lines', () => {
    it('single seleção with multiple stickers → contains URU: 1, 4, 12', () => {
      const matches = [
        {
          selecao: MOCK_SELECAO_URU,
          figurinhas: [
            makeFig('f1', 'sel-uru', '1', 'Suárez'),
            makeFig('f2', 'sel-uru', '4', 'Cavani'),
            makeFig('f3', 'sel-uru', '12', 'Bentancur'),
          ],
        },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('URU: 1, 4, 12');
    });

    it('multiple seleções appear on separate lines', () => {
      const matches = [
        { selecao: MOCK_SELECAO_URU, figurinhas: [makeFig('f1', 'sel-uru', '1', 'Suárez')] },
        { selecao: MOCK_SELECAO_BRA, figurinhas: [makeFig('f2', 'sel-bra', '7', 'Vini')] },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('URU:');
      expect(result).toContain('BRA:');
      const uruIndex = result.indexOf('URU:');
      const braIndex = result.indexOf('BRA:');
      expect(uruIndex).not.toBe(braIndex);
    });

    it('numbers are comma-separated with a space after each comma', () => {
      const matches = [
        {
          selecao: MOCK_SELECAO_BRA,
          figurinhas: [
            makeFig('f1', 'sel-bra', '3', 'A'),
            makeFig('f2', 'sel-bra', '7', 'B'),
            makeFig('f3', 'sel-bra', '33', 'C'),
          ],
        },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('3, 7, 33');
    });

    it('player names do NOT appear in the output', () => {
      const matches = [
        {
          selecao: MOCK_SELECAO_BRA,
          figurinhas: [makeFig('f1', 'sel-bra', '7', 'Neymar')],
        },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).not.toContain('Neymar');
    });

    it('flag emoji appears for each team', () => {
      const matches = [
        { selecao: MOCK_SELECAO_URU, figurinhas: [makeFig('f1', 'sel-uru', '1', 'X')] },
        { selecao: MOCK_SELECAO_BRA, figurinhas: [makeFig('f2', 'sel-bra', '7', 'Y')] },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('🇺🇾');
      expect(result).toContain('🇧🇷');
    });
  });

  describe('footer', () => {
    it('output contains total count with correct number', () => {
      const matches = [
        {
          selecao: MOCK_SELECAO_URU,
          figurinhas: [makeFig('f1', 'sel-uru', '1', 'A'), makeFig('f2', 'sel-uru', '4', 'B')],
        },
        {
          selecao: MOCK_SELECAO_BRA,
          figurinhas: [makeFig('f3', 'sel-bra', '7', 'C')],
        },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('Total: 3 figurinhas');
    });

    it('singular "figurinha" when total is 1', () => {
      const matches = [
        { selecao: MOCK_SELECAO_BRA, figurinhas: [makeFig('f1', 'sel-bra', '7', 'X')] },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('Total: 1 figurinha');
      expect(result).not.toContain('Total: 1 figurinhas');
    });

    it('output contains attribution line with album name', () => {
      const matches = [
        { selecao: MOCK_SELECAO_BRA, figurinhas: [makeFig('f1', 'sel-bra', '7', 'X')] },
      ];
      const result = formatTradeResult(matches, ALBUM_NAME);
      expect(result).toContain('Enviado pelo Álbum Copa 2026 📱');
    });
  });

  describe('empty matches', () => {
    it('empty matches array returns a non-empty graceful message without throwing', () => {
      const result = formatTradeResult([], ALBUM_NAME);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('empty matches message does not contain the header or footer', () => {
      const result = formatTradeResult([], ALBUM_NAME);
      expect(result).not.toContain('🤝 Figuras');
      expect(result).not.toContain('Total:');
    });
  });
});
