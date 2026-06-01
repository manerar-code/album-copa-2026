import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import type { Selecao, Figurinha } from '@shared/types/index';

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
jest.mock('@modules/auth/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));
jest.mock('@shared/store/userSettingsStore', () => ({
  useUserSettingsStore: jest.fn(),
  displayType: (type: string) => type,
  FIXED_TYPES: [],
  TYPE_DISPLAY: {},
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: { load: jest.fn(), upsertOne: jest.fn() },
}));

import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { HomeScreen } from '@modules/dashboard/screens/HomeScreen';
import { AlbumListScreen } from '@modules/album/screens/AlbumListScreen';
import { TeamDetailScreen } from '@modules/album/screens/TeamDetailScreen';
import { StatsScreen } from '@modules/dashboard/screens/StatsScreen';

const BASE_STICKER_STORE = {
  isInitialized: false,
  isLoading: false,
  album: null,
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

const BASE_AUTH_STORE = {
  user: null,
  isLoading: false,
  showAlbumsModal: false,
  setUser: jest.fn(),
  setLoading: jest.fn(),
  setShowAlbumsModal: jest.fn(),
};

const BASE_USER_SETTINGS_STORE = {
  trackedTypes: null,
  setTrackedTypes: jest.fn(),
  loadSettings: jest.fn(),
};

function setupMocks(stickerOverrides: Partial<typeof BASE_STICKER_STORE> = {}) {
  (useStickerStore as unknown as jest.Mock).mockReturnValue({ ...BASE_STICKER_STORE, ...stickerOverrides });
  (useAuthStore as unknown as jest.Mock).mockReturnValue(BASE_AUTH_STORE);
  (useUserSettingsStore as unknown as jest.Mock).mockReturnValue(BASE_USER_SETTINGS_STORE);
}

const TEAM_DETAIL_ROUTE = {
  params: { selecaoId: 'sel-1', selecaoNome: 'Test Team' },
  key: 'TeamDetail-1',
  name: 'TeamDetail' as const,
};

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
  nome: 'Vinicius',
  type: 'Player',
  descricao: 'Vinicius Jr.',
  ordem: 1,
};

const MOCK_FIGURINHA_2: Figurinha = {
  id: 'fig-2',
  album_id: 'album-1',
  selecao_id: 'sel-1',
  numero: '11',
  nome: 'Rodrygo',
  type: 'Player',
  descricao: 'Rodrygo',
  ordem: 2,
};

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.clearAllMocks();
});

describe('HomeScreen skeleton', () => {
  it('renders HomeSkeleton when isInitialized=false', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<HomeScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('HomeSkeleton has accessibilityLabel="Carregando..."', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<HomeScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('does not render skeleton when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { queryByLabelText } = render(<HomeScreen />);
    expect(queryByLabelText('Carregando...')).toBeNull();
  });

  it('renders real content (progress label) when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('PROGRESSO GERAL')).toBeTruthy();
  });

  it('renders stats grid labels when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('Tenho')).toBeTruthy();
    expect(getByText('Faltam')).toBeTruthy();
    expect(getByText('Repetidas')).toBeTruthy();
  });

  it('renders typeStats section when figurinhas have types', () => {
    setupMocks({
      isInitialized: true,
      figurinhas: [MOCK_FIGURINHA, MOCK_FIGURINHA_2],
      collection: { 'fig-1': 'owned', 'fig-2': 'duplicate' },
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Por Tipo')).toBeTruthy();
  });

  it('renders teamsWithDuplicates section when teams have dup stickers', () => {
    setupMocks({
      isInitialized: true,
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'duplicate' },
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Repetidas por Seleção')).toBeTruthy();
    expect(getByText('Brasil')).toBeTruthy();
  });

  it('transitions from skeleton to real content without crash', () => {
    setupMocks({ isInitialized: false });
    const { queryByLabelText, rerender } = render(<HomeScreen />);
    expect(queryByLabelText('Carregando...')).toBeTruthy();

    setupMocks({ isInitialized: true });
    rerender(<HomeScreen />);

    expect(queryByLabelText('Carregando...')).toBeNull();
  });
});

describe('AlbumListScreen skeleton', () => {
  it('renders AlbumListSkeleton when isInitialized=false', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<AlbumListScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('AlbumListSkeleton has accessibilityLabel="Carregando..."', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<AlbumListScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('does not render skeleton when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { queryByLabelText } = render(<AlbumListScreen />);
    expect(queryByLabelText('Carregando...')).toBeNull();
  });

  it('renders empty list state (real content) when isInitialized=true and no teams', () => {
    setupMocks({ isInitialized: true, selecoes: [] });
    const { getByText } = render(<AlbumListScreen />);
    expect(getByText('Nenhuma seleção encontrada')).toBeTruthy();
  });

  it('renders team row when isInitialized=true with selecoes data', () => {
    setupMocks({
      isInitialized: true,
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'owned' },
    });
    const { getByText } = render(<AlbumListScreen />);
    expect(getByText('Brasil')).toBeTruthy();
  });

  it('renders type filter chips when figurinhas have types', () => {
    setupMocks({
      isInitialized: true,
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
    });
    const { getAllByText } = render(<AlbumListScreen />);
    // "Todos" chip is always shown plus the type-specific chip
    expect(getAllByText('Todos').length).toBeGreaterThan(0);
  });

  it('renders team row with dup badge when figurinha is duplicate', () => {
    setupMocks({
      isInitialized: true,
      selecoes: [MOCK_SELECAO],
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'duplicate' },
    });
    const { getByText } = render(<AlbumListScreen />);
    expect(getByText('1 rep')).toBeTruthy();
  });

  it('transitions from skeleton to real content without crash', () => {
    setupMocks({ isInitialized: false });
    const { queryByLabelText, rerender } = render(<AlbumListScreen />);
    expect(queryByLabelText('Carregando...')).toBeTruthy();

    setupMocks({ isInitialized: true });
    rerender(<AlbumListScreen />);

    expect(queryByLabelText('Carregando...')).toBeNull();
  });
});

describe('TeamDetailScreen skeleton', () => {
  it('renders TeamDetailSkeleton when isInitialized=false', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('TeamDetailSkeleton has accessibilityLabel="Carregando..."', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('does not render skeleton when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { queryByLabelText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(queryByLabelText('Carregando...')).toBeNull();
  });

  it('renders real content (legend labels) when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { getByText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(getByText('Faltante')).toBeTruthy();
  });

  it('renders sticker cards when isInitialized=true with matching figurinhas', () => {
    setupMocks({
      isInitialized: true,
      figurinhas: [MOCK_FIGURINHA, MOCK_FIGURINHA_2],
      collection: { 'fig-1': 'owned', 'fig-2': 'missing' },
    });
    const { getAllByText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(getAllByText('10').length).toBeGreaterThan(0);
  });

  it('shows correct owned counter when isInitialized=true', () => {
    setupMocks({
      isInitialized: true,
      figurinhas: [MOCK_FIGURINHA],
      collection: { 'fig-1': 'owned' },
    });
    const { getByText } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(getByText('1/1')).toBeTruthy();
  });

  it('transitions from skeleton to real content without crash', () => {
    setupMocks({ isInitialized: false });
    const { queryByLabelText, rerender } = render(
      <TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />,
    );
    expect(queryByLabelText('Carregando...')).toBeTruthy();

    setupMocks({ isInitialized: true });
    rerender(<TeamDetailScreen route={TEAM_DETAIL_ROUTE} navigation={{} as never} />);

    expect(queryByLabelText('Carregando...')).toBeNull();
  });
});

describe('StatsScreen skeleton', () => {
  it('renders StatsSkeleton when isInitialized=false', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<StatsScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('StatsSkeleton has accessibilityLabel="Carregando..."', () => {
    setupMocks({ isInitialized: false });
    const { getByLabelText } = render(<StatsScreen />);
    expect(getByLabelText('Carregando...')).toBeTruthy();
  });

  it('does not render skeleton when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { queryByLabelText } = render(<StatsScreen />);
    expect(queryByLabelText('Carregando...')).toBeNull();
  });

  it('renders real content (Resumo section) when isInitialized=true', () => {
    setupMocks({ isInitialized: true });
    const { getByText } = render(<StatsScreen />);
    expect(getByText('Resumo')).toBeTruthy();
  });

  it('renders type and team sections when figurinhas and selecoes provided', () => {
    setupMocks({
      isInitialized: true,
      figurinhas: [MOCK_FIGURINHA, MOCK_FIGURINHA_2],
      selecoes: [MOCK_SELECAO],
      collection: { 'fig-1': 'owned', 'fig-2': 'duplicate' },
    });
    const { getByText } = render(<StatsScreen />);
    expect(getByText(/Por Tipo/)).toBeTruthy();
    expect(getByText(/Por Seleção/)).toBeTruthy();
  });

  it('renders team row items when isInitialized=true with selecoes', () => {
    setupMocks({
      isInitialized: true,
      figurinhas: [MOCK_FIGURINHA],
      selecoes: [MOCK_SELECAO],
      collection: { 'fig-1': 'owned' },
    });
    const { getAllByText } = render(<StatsScreen />);
    expect(getAllByText('Brasil').length).toBeGreaterThan(0);
  });

  it('transitions from skeleton to real content without crash', () => {
    setupMocks({ isInitialized: false });
    const { queryByLabelText, rerender } = render(<StatsScreen />);
    expect(queryByLabelText('Carregando...')).toBeTruthy();

    setupMocks({ isInitialized: true });
    rerender(<StatsScreen />);

    expect(queryByLabelText('Carregando...')).toBeNull();
  });
});
