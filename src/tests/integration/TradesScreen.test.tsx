import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import { TradesScreen } from '@modules/trades/screens/TradesScreen';
import type { Selecao, Figurinha } from '@shared/types';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    withRepeat: jest.fn((a: unknown) => a),
    withTiming: jest.fn((v: unknown) => v),
    cancelAnimation: jest.fn(),
  };
});

jest.mock('@modules/album/store/stickerStore', () => ({
  useStickerStore: jest.fn(),
}));

jest.mock('@shared/components/FlagImage', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { FlagImage: () => React.createElement(View, null) };
});

jest.mock('@shared/components/CromoCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    CromoCard: ({ numero }: { numero: string }) =>
      React.createElement(
        View,
        { testID: `cromo-${numero}` },
        React.createElement(Text, null, numero),
      ),
  };
});

jest.mock('@shared/components/ScreenHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ScreenHeader: ({ title, subtitle }: { title: string; subtitle?: string }) =>
      React.createElement(
        Text,
        { testID: 'screen-header' },
        `${title}${subtitle ? ` | ${subtitle}` : ''}`,
      ),
  };
});

import { useStickerStore } from '@modules/album/store/stickerStore';

const SELECAO_URU: Selecao = {
  id: 'sel-uru',
  album_id: 'album-1',
  nome: 'Uruguai',
  codigo_fifa: 'URU',
  ordem: 1,
  bandeira_url: '',
};

const SELECAO_BRA: Selecao = {
  id: 'sel-bra',
  album_id: 'album-1',
  nome: 'Brasil',
  codigo_fifa: 'BRA',
  ordem: 2,
  bandeira_url: '',
};

const FIG_URU_1: Figurinha = {
  id: 'fig-uru-1',
  album_id: 'album-1',
  selecao_id: 'sel-uru',
  numero: 'URU1',
  nome: 'Suárez',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

const FIG_URU_2: Figurinha = {
  id: 'fig-uru-2',
  album_id: 'album-1',
  selecao_id: 'sel-uru',
  numero: 'URU2',
  nome: 'Cavani',
  type: 'Player',
  descricao: '',
  ordem: 2,
};

const FIG_BRA_7: Figurinha = {
  id: 'fig-bra-7',
  album_id: 'album-1',
  selecao_id: 'sel-bra',
  numero: 'BRA7',
  nome: 'Vinicius',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

function buildStore(overrides: Record<string, unknown> = {}) {
  return {
    album: { id: 'album-1', nome: 'Álbum Copa 2026', versao: 1 },
    selecoes: [SELECAO_URU, SELECAO_BRA],
    figurinhas: [FIG_URU_1, FIG_URU_2, FIG_BRA_7],
    collection: {
      'fig-uru-1': 'missing',
      'fig-uru-2': 'missing',
      'fig-bra-7': 'missing',
    } as Record<string, string>,
    allCollections: {},
    userAlbums: [],
    activeUserAlbumId: null,
    syncUserId: null,
    applyCollection: jest.fn(),
    toggleSticker: jest.fn(),
    setStatus: jest.fn(),
    resetCollection: jest.fn(),
    getStatus: jest.fn().mockReturnValue('missing'),
    getStats: jest.fn().mockReturnValue({ total: 3, owned: 0, missing: 3, duplicate: 0 }),
    getTradeSource: jest.fn().mockReturnValue(null),
    ...overrides,
  };
}

function setup(storeOverrides: Record<string, unknown> = {}) {
  (useStickerStore as unknown as jest.Mock).mockReturnValue(buildStore(storeOverrides));
  return render(<TradesScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TradesScreen — unified inline screen', () => {
  it('renders TextInput with placeholder on mount', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText('Lista de repetidas')).toBeTruthy();
  });

  it('✕ Limpar button is absent when input is empty', () => {
    const { queryByText } = setup();
    expect(queryByText(/Limpar/)).toBeNull();
  });

  it('✕ Limpar button appears when input has text', () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'BRA01');
    expect(getByText(/Limpar/)).toBeTruthy();
  });

  it('✕ Limpar button triggers Alert.alert with "Apagar lista?" title', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'BRA01');
    fireEvent.press(getByText(/Limpar/));
    expect(alertSpy).toHaveBeenCalledWith('Apagar lista?', expect.any(String), expect.any(Array));
    alertSpy.mockRestore();
  });

  it('pasting "URU01 BRA07" renders section headers without pressing any button', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 BRA07');
    await waitFor(() => {
      expect(getByText('Uruguai')).toBeTruthy();
      expect(getByText('Brasil')).toBeTruthy();
    });
  });

  it('pasting "1;2;10" shows parseError box; no section headers rendered', () => {
    const { getByLabelText, getByText, queryByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), '1;2;10');
    expect(getByText(/Nenhum código de país encontrado/)).toBeTruthy();
    expect(queryByText('Uruguai')).toBeNull();
  });

  it('pasting codes for stickers all owned shows empty state and informadas list', async () => {
    const { getByLabelText, getByText } = setup({
      collection: { 'fig-uru-1': 'owned', 'fig-uru-2': 'owned', 'fig-bra-7': 'owned' },
    });
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 BRA07');
    await waitFor(() => {
      expect(getByText(/Nenhuma figurinha em comum/)).toBeTruthy();
      expect(getByText(/Figurinhas informadas/)).toBeTruthy();
      expect(getByText('Uruguai')).toBeTruthy();
    });
  });

  it('section header shows team name and sticker count', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => {
      expect(getByText('Uruguai')).toBeTruthy();
      expect(getByText('1 fig.')).toBeTruthy();
    });
  });

  it('CromoCard rendered for each matching sticker at renderItem index 0', async () => {
    const { getByLabelText, getByTestId } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 URU02');
    await waitFor(() => {
      expect(getByTestId('cromo-URU1')).toBeTruthy();
      expect(getByTestId('cromo-URU2')).toBeTruthy();
    });
  });

  it('WhatsApp share button absent when input is empty', () => {
    const { queryByText } = setup();
    expect(queryByText(/Enviar pelo WhatsApp/)).toBeNull();
  });

  it('WhatsApp share button appears when there are matching stickers', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => {
      expect(getByText('📲 Enviar pelo WhatsApp')).toBeTruthy();
    });
  });

  it('pressing WhatsApp share calls Share.share with message containing team FIFA code', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => expect(getByText('📲 Enviar pelo WhatsApp')).toBeTruthy());
    fireEvent.press(getByText('📲 Enviar pelo WhatsApp'));
    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('URU') }),
      );
    });
    shareSpy.mockRestore();
  });

  it('clearing input text removes all section headers', async () => {
    const { getByLabelText, getByText, queryByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => expect(getByText('Uruguai')).toBeTruthy());
    fireEvent.changeText(getByLabelText('Lista de repetidas'), '');
    expect(queryByText('Uruguai')).toBeNull();
  });

  it('album complete info box visible when stats.missing === 0', () => {
    const { getByText } = setup({
      getStats: jest.fn().mockReturnValue({ total: 3, owned: 3, missing: 0, duplicate: 0 }),
    });
    expect(getByText(/álbum completo/i)).toBeTruthy();
  });

  it('collection state is never mutated during any interaction', async () => {
    const store = buildStore();
    (useStickerStore as unknown as jest.Mock).mockReturnValue(store);
    const { getByLabelText } = render(<TradesScreen />);
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => {});
    expect(store.toggleSticker).not.toHaveBeenCalled();
    expect(store.setStatus).not.toHaveBeenCalled();
  });

  it('preview text "figurinhas encontradas" appears when valid codes are detected', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    await waitFor(() => {
      expect(getByText(/figurinhas encontradas/)).toBeTruthy();
    });
  });

  it('empty input shows no sections, no parseError, and no empty state', () => {
    const { queryByText } = setup();
    expect(queryByText('Uruguai')).toBeNull();
    expect(queryByText(/Nenhum código/)).toBeNull();
    expect(queryByText(/Nenhuma figurinha em comum/)).toBeNull();
  });

  it('unknown FIFA code (XYZ01) in input is silently skipped — no sections, no error', async () => {
    const { getByLabelText, queryByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'XYZ01');
    await waitFor(() => {});
    expect(queryByText('Uruguai')).toBeNull();
    expect(queryByText(/Nenhum código/)).toBeNull();
  });
});
