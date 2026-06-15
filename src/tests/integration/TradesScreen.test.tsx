import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
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
  numero: '1',
  nome: 'Suárez',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

const FIG_BRA_7: Figurinha = {
  id: 'fig-bra-7',
  album_id: 'album-1',
  selecao_id: 'sel-bra',
  numero: '7',
  nome: 'Vinicius',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

const ALL_SELECOES = [SELECAO_URU, SELECAO_BRA];
const ALL_FIGURINHAS = [FIG_URU_1, FIG_BRA_7];

function buildStore(overrides: Record<string, unknown> = {}) {
  return {
    album: { id: 'album-1', nome: 'Álbum Copa 2026', versao: 1 },
    selecoes: ALL_SELECOES,
    figurinhas: ALL_FIGURINHAS,
    collection: { 'fig-uru-1': 'missing', 'fig-bra-7': 'missing' } as Record<string, string>,
    allCollections: {},
    userAlbums: [],
    activeUserAlbumId: null,
    syncUserId: null,
    applyCollection: jest.fn(),
    toggleSticker: jest.fn(),
    setStatus: jest.fn(),
    resetCollection: jest.fn(),
    getStatus: jest.fn().mockReturnValue('missing'),
    getStats: jest.fn().mockReturnValue({ total: 2, owned: 0, missing: 2, duplicate: 0 }),
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

describe('TradesScreen — input state', () => {
  it('renders TextInput with placeholder on initial load', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText('Lista de repetidas')).toBeTruthy();
  });

  it('renders Comparar button', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText('Comparar')).toBeTruthy();
  });

  it('Comparar button is disabled when TextInput is empty', () => {
    const { getByLabelText } = setup();
    const btn = getByLabelText('Comparar');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
  });

  it('shows hasNoPrefix error when pasting numbers without country prefix', () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), '1;2;10');
    fireEvent.press(getByLabelText('Comparar'));
    expect(getByText(/Nenhum código de país encontrado/)).toBeTruthy();
  });

  it('does not transition to result state when hasNoPrefix error occurs', () => {
    const { getByLabelText, queryByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), '1 2 3');
    fireEvent.press(getByLabelText('Comparar'));
    expect(queryByText('Nova comparação')).toBeNull();
  });

  it('shows album completo message when user has zero missing stickers', () => {
    const { getByText } = setup({
      getStats: jest.fn().mockReturnValue({ total: 2, owned: 2, missing: 0, duplicate: 0 }),
    });
    expect(getByText(/álbum completo/i)).toBeTruthy();
  });
});

describe('TradesScreen — comparison result', () => {
  it('valid prefixed input transitions to result view with matching stickers', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 BRA07');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => {
      expect(getByText('Nova comparação')).toBeTruthy();
    });
    expect(getByText(/2 figurinhas/)).toBeTruthy();
  });

  it('shows sticker numbers in result grouped by team', async () => {
    const { getByLabelText, getByText } = setup({
      collection: { 'fig-uru-1': 'missing' },
      figurinhas: [FIG_URU_1],
    });
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('shows empty state when intersection is empty (friend has stickers user already owns)', async () => {
    const { getByLabelText, getByText } = setup({
      collection: { 'fig-uru-1': 'owned', 'fig-bra-7': 'owned' },
    });
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 BRA07');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => {
      expect(getByText(/Nenhuma figurinha em comum/)).toBeTruthy();
    });
  });

  it('tap "Nova comparação" resets screen to input state', async () => {
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => expect(getByText('Nova comparação')).toBeTruthy());
    fireEvent.press(getByText('Nova comparação'));
    await waitFor(() => expect(getByLabelText('Lista de repetidas')).toBeTruthy());
  });

  it('tap "Enviar pelo WhatsApp" calls Share.share with a message string', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const { getByLabelText, getByText } = setup();
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => expect(getByText('📲 Enviar pelo WhatsApp')).toBeTruthy());
    fireEvent.press(getByText('📲 Enviar pelo WhatsApp'));
    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('URU') }),
      );
    });
    shareSpy.mockRestore();
  });

  it('sticker number not in catalog (figurinha not found) is silently skipped', async () => {
    const { getByLabelText, getByText } = setup({
      figurinhas: [FIG_URU_1], // only URU1 — BRA99 does not exist
      collection: { 'fig-uru-1': 'missing' },
    });
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 BRA99');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => expect(getByText('Nova comparação')).toBeTruthy());
    // URU01 matched, BRA99 was skipped — result has 1 figurinha
    expect(getByText(/1 figurinha/)).toBeTruthy();
  });

  it('multiple figurinhas in one section renders correctly (renderItem index branches)', async () => {
    const FIG_URU_2: Figurinha = {
      id: 'fig-uru-2',
      album_id: 'album-1',
      selecao_id: 'sel-uru',
      numero: '2',
      nome: 'Cavani',
      type: 'Player',
      descricao: '',
      ordem: 2,
    };
    const { getByLabelText, getByText } = setup({
      figurinhas: [FIG_URU_1, FIG_URU_2],
      collection: { 'fig-uru-1': 'missing', 'fig-uru-2': 'missing' },
    });
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01 URU02');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => expect(getByText('Nova comparação')).toBeTruthy());
    expect(getByText(/2 figurinhas/)).toBeTruthy();
  });

  it('collection state is never modified during any interaction', async () => {
    const store = buildStore();
    (useStickerStore as unknown as jest.Mock).mockReturnValue(store);
    const { getByLabelText } = render(<TradesScreen />);
    fireEvent.changeText(getByLabelText('Lista de repetidas'), 'URU01');
    fireEvent.press(getByLabelText('Comparar'));
    await waitFor(() => {});
    expect(store.toggleSticker).not.toHaveBeenCalled();
    expect(store.setStatus).not.toHaveBeenCalled();
  });
});
