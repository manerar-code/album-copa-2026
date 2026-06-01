import { formatMissingList } from '@modules/missing/utils/formatMissingList';
import type { UserCollection, Selecao, Figurinha } from '@shared/types';

const MOCK_SELECAO_BRASIL: Selecao = {
  id: 'sel-bra',
  album_id: 'album-1',
  nome: 'Brasil',
  codigo_fifa: 'BRA',
  ordem: 1,
  bandeira_url: '',
};

const MOCK_SELECAO_ARG: Selecao = {
  id: 'sel-arg',
  album_id: 'album-1',
  nome: 'Argentina',
  codigo_fifa: 'ARG',
  ordem: 2,
  bandeira_url: '',
};

const MOCK_FIG_BRA_1: Figurinha = {
  id: 'fig-bra-1',
  album_id: 'album-1',
  selecao_id: 'sel-bra',
  numero: '12',
  nome: 'Vinicius Jr.',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

const MOCK_FIG_BRA_2: Figurinha = {
  id: 'fig-bra-2',
  album_id: 'album-1',
  selecao_id: 'sel-bra',
  numero: '14',
  nome: 'Rodrygo',
  type: 'Player',
  descricao: '',
  ordem: 2,
};

const MOCK_FIG_ARG_1: Figurinha = {
  id: 'fig-arg-1',
  album_id: 'album-1',
  selecao_id: 'sel-arg',
  numero: '7',
  nome: 'Messi',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

const MOCK_FIG_BRA_3: Figurinha = {
  id: 'fig-bra-3',
  album_id: 'album-1',
  selecao_id: 'sel-bra',
  numero: '18',
  nome: 'Escudo',
  type: 'Team',
  descricao: '',
  ordem: 3,
};

const ALBUM_NAME = 'Álbum Copa 2026';

function normalizeDate(text: string, year: number, month: number, day: number): string {
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  return text.replace(
    /Gerado em: \d{2}\/\d{2}\/\d{4}/,
    `Gerado em: ${d}/${m}/${year}`,
  );
}

describe('formatMissingList', () => {
  it('retorna texto com "Total: 0 figurinhas faltantes" quando coleção vazia', () => {
    const result = formatMissingList({}, [], [], ALBUM_NAME);
    expect(result).toContain('Total: 0 figurinhas faltantes');
    expect(result).toContain(ALBUM_NAME);
    expect(result).toContain('Gerado em:');
  });

  it('agrupa por seleção com seções e total correto para 3 faltantes em 2 seleções', () => {
    const collection: UserCollection = {
      'fig-bra-1': 'missing',
      'fig-bra-2': 'missing',
      'fig-arg-1': 'missing',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL, MOCK_SELECAO_ARG],
      [MOCK_FIG_BRA_1, MOCK_FIG_BRA_2, MOCK_FIG_ARG_1],
      ALBUM_NAME,
    );

    expect(result).toContain('Brasil (2 faltantes)');
    expect(result).toContain('  #12 Vinicius Jr.');
    expect(result).toContain('  #14 Rodrygo');
    expect(result).toContain('Argentina (1 faltante)');
    expect(result).toContain('  #7 Messi');
    expect(result).toContain('Total: 3 figurinhas faltantes');
  });

  it('filterSelecaoId retorna apenas figurinhas da seleção filtrada', () => {
    const collection: UserCollection = {
      'fig-bra-1': 'missing',
      'fig-bra-2': 'missing',
      'fig-arg-1': 'missing',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL, MOCK_SELECAO_ARG],
      [MOCK_FIG_BRA_1, MOCK_FIG_BRA_2, MOCK_FIG_ARG_1],
      ALBUM_NAME,
      'sel-bra',
    );

    expect(result).toContain('Brasil (2 faltantes)');
    expect(result).not.toContain('Argentina');
    expect(result).not.toContain('Messi');
    expect(result).toContain('Total: 2 figurinhas faltantes');
  });

  it('figurinhas owned ou duplicate não aparecem na lista', () => {
    const collection: UserCollection = {
      'fig-bra-1': 'owned',
      'fig-bra-2': 'duplicate',
      'fig-arg-1': 'missing',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL, MOCK_SELECAO_ARG],
      [MOCK_FIG_BRA_1, MOCK_FIG_BRA_2, MOCK_FIG_ARG_1],
      ALBUM_NAME,
    );

    expect(result).not.toContain('Vinicius Jr.');
    expect(result).not.toContain('Rodrygo');
    expect(result).toContain('Argentina (1 faltante)');
    expect(result).toContain('Messi');
    expect(result).toContain('Total: 1 figurinha faltante');
  });

  it('inclui emoji de bandeira para cada seleção', () => {
    const collection: UserCollection = {
      'fig-bra-1': 'missing',
      'fig-arg-1': 'missing',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL, MOCK_SELECAO_ARG],
      [MOCK_FIG_BRA_1, MOCK_FIG_ARG_1],
      ALBUM_NAME,
    );

    // Brazil flag emoji (🇧🇷) and Argentina flag emoji (🇦🇷)
    expect(result).toContain('🇧🇷');
    expect(result).toContain('🇦🇷');
  });

  it('data no cabeçalho formatada como dd/MM/yyyy', () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const result = formatMissingList({}, [], [], ALBUM_NAME);
    expect(result).toContain(`Gerado em: ${day}/${month}/${year}`);
  });

  it('seleção sem figurinhas faltantes não aparece no texto', () => {
    const collection: UserCollection = {
      'fig-bra-1': 'missing',
      'fig-arg-1': 'owned',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL, MOCK_SELECAO_ARG],
      [MOCK_FIG_BRA_1, MOCK_FIG_ARG_1],
      ALBUM_NAME,
    );

    expect(result).toContain('Brasil');
    expect(result).not.toContain('Argentina');
    expect(result).toContain('Total: 1 figurinha faltante');
  });

  it('figurinhas são ordenadas por ordem dentro de cada seleção', () => {
    const collection: UserCollection = {
      'fig-bra-3': 'missing',
      'fig-bra-1': 'missing',
      'fig-bra-2': 'missing',
    };
    const result = formatMissingList(
      collection,
      [MOCK_SELECAO_BRASIL],
      [MOCK_FIG_BRA_3, MOCK_FIG_BRA_1, MOCK_FIG_BRA_2],
      ALBUM_NAME,
    );

    const braIndex = result.indexOf('Brasil');
    const fig1Index = result.indexOf('#12 Vinicius Jr.');
    const fig2Index = result.indexOf('#14 Rodrygo');
    const fig3Index = result.indexOf('#18 Escudo');

    expect(fig1Index).toBeGreaterThan(braIndex);
    expect(fig2Index).toBeGreaterThan(fig1Index);
    expect(fig3Index).toBeGreaterThan(fig2Index);
  });
});
