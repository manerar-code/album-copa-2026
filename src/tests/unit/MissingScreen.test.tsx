import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MissingScreen } from '@modules/missing/screens/MissingScreen';
import type { Selecao, Figurinha } from '@shared/types';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    withRepeat: jest.fn((animation) => animation),
    withTiming: jest.fn((value) => value),
    cancelAnimation: jest.fn(),
  };
});

jest.mock('@modules/album/store/stickerStore', () => ({
  useStickerStore: jest.fn(),
}));

jest.mock('@shared/store/userSettingsStore', () => ({
  useUserSettingsStore: jest.fn(),
  displayType: (type: string) => type,
  FIXED_TYPES: [],
  TYPE_DISPLAY: {},
}));

jest.mock('@shared/components/SearchInput', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    SearchInput: (props: any) => React.createElement(Text, null, ''),
  };
});

const MOCK_SELECAO: Selecao = {
  id: 'sel-1',
  album_id: 'album-1',
  nome: 'Brasil',
  codigo_fifa: 'BRA',
  ordem: 1,
  bandeira_url: '',
};

const MOCK_FIGURINHA: Figurinha = {
  id: 'fig-1',
  album_id: 'album-1',
  selecao_id: 'sel-1',
  numero: '10',
  nome: 'Neymar',
  type: 'Player',
  descricao: '',
  ordem: 1,
};

import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';

const mockClipboard = () => require('expo-clipboard');

const BASE_STICKER_STORE = {
  album: { id: 'album-1', nome: 'Álbum Copa 2026', versao: 1 },
  selecoes: [] as Selecao[],
  figurinhas: [] as Figurinha[],
  collection: {} as Record<string, 'missing' | 'owned' | 'duplicate'>,
  allCollections: {} as Record<string, Record<string, 'missing' | 'owned' | 'duplicate'>>,
  userAlbums: [] as { id: string; name: string }[],
  activeUserAlbumId: null,
  syncUserId: null,
  applyCollection: jest.fn(),
  toggleSticker: jest.fn(),
  setStatus: jest.fn(),
  resetCollection: jest.fn(),
  getStatus: jest.fn().mockReturnValue('missing'),
  getStats: jest.fn().mockReturnValue({ total: 0, owned: 0, missing: 0, duplicate: 0 }),
  getTradeSource: jest.fn().mockReturnValue(null),
};

const BASE_USER_SETTINGS_STORE = {
  trackedTypes: null,
  setTrackedTypes: jest.fn(),
  loadSettings: jest.fn(),
};

function setupMocks(stickerOverrides: Partial<typeof BASE_STICKER_STORE> = {}) {
  (useStickerStore as unknown as jest.Mock).mockReturnValue({ ...BASE_STICKER_STORE, ...stickerOverrides });
  (useUserSettingsStore as unknown as jest.Mock).mockReturnValue(BASE_USER_SETTINGS_STORE);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockClipboard().setStringAsync.mockResolvedValue(undefined);
});

describe('MissingScreen - export button', () => {
  it('botão de exportação visível quando há faltantes', () => {
    setupMocks({
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'missing' },
    });
    const { getByLabelText } = render(<MissingScreen />);
    expect(getByLabelText('Exportar lista de faltantes')).toBeTruthy();
  });

  it('botão desabilitado quando missingCount === 0', () => {
    setupMocks({
      selecoes: [],
      figurinhas: [],
      collection: {},
    });
    const { getByLabelText } = render(<MissingScreen />);
    const btn = getByLabelText('Exportar lista de faltantes');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
  });

  it('pressionar botão chama Clipboard.setStringAsync com texto correto', async () => {
    setupMocks({
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'missing' },
    });
    const { getByLabelText } = render(<MissingScreen />);
    const btn = getByLabelText('Exportar lista de faltantes');
    fireEvent.press(btn);

    await waitFor(() => {
      expect(mockClipboard().setStringAsync).toHaveBeenCalledTimes(1);
    });

    const calledText = mockClipboard().setStringAsync.mock.calls[0][0];
    expect(calledText).toContain('Álbum Copa 2026');
    expect(calledText).toContain('Neymar');
    expect(calledText).toContain('Total: 1');
  });

  it('setStringAsync com sucesso exibe feedback de sucesso', async () => {
    jest.useFakeTimers();
    mockClipboard().setStringAsync.mockResolvedValue(undefined);

    setupMocks({
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'missing' },
    });
    const { getByLabelText, getByText } = render(<MissingScreen />);
    const btn = getByLabelText('Exportar lista de faltantes');
    fireEvent.press(btn);

    await waitFor(() => {
      expect(getByText('✅ Lista copiada!')).toBeTruthy();
    });

    jest.runAllTimers();

    await waitFor(() => {
      expect(() => getByText('✅ Lista copiada!')).toThrow();
    });

    jest.useRealTimers();
  });

  it('setStringAsync lança exceção exibe feedback de erro', async () => {
    jest.useFakeTimers();
    mockClipboard().setStringAsync.mockRejectedValue(new Error('Permission denied'));

    setupMocks({
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'missing' },
    });
    const { getByLabelText, getByText } = render(<MissingScreen />);
    const btn = getByLabelText('Exportar lista de faltantes');
    fireEvent.press(btn);

    await waitFor(() => {
      expect(getByText('❌ Erro ao copiar')).toBeTruthy();
    });

    jest.runAllTimers();

    await waitFor(() => {
      expect(() => getByText('❌ Erro ao copiar')).toThrow();
    });

    jest.useRealTimers();
  });
});
