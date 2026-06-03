import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '@modules/dashboard/screens/HomeScreen';
import type { Selecao, Figurinha } from '@shared/types';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren<object>) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

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

jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: {
    load: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@shared/components/ProgressBar', () => ({
  ProgressBar: () => null,
}));

jest.mock('@shared/components/GlassCard', () => ({
  GlassCard: ({ children }: React.PropsWithChildren<object>) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@shared/components/SkeletonBox', () => ({
  SkeletonBox: () => null,
}));

jest.mock('@shared/components/HelpModal', () => ({
  HelpModal: () => null,
}));

jest.mock('@shared/components/FlagImage', () => ({
  FlagImage: () => null,
}));

jest.mock('@core/providers/OnboardingContext', () => {
  const React = require('react');
  const ctx = React.createContext({
    showOnboarding: false,
    completeOnboarding: jest.fn(),
    restartTutorial: jest.fn(),
  });
  return { OnboardingContext: ctx };
});

import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';

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
  isInitialized: true,
};

const BASE_AUTH_STORE = {
  user: { id: 'u1', email: 'test@test.com', name: 'Test User', avatar_url: null },
  setShowAlbumsModal: jest.fn(),
  showAlbumsModal: false,
};

const BASE_USER_SETTINGS_STORE = {
  trackedTypes: null,
  setTrackedTypes: jest.fn(),
  loadSettings: jest.fn(),
};

function setupMocks(stickerOverrides: Partial<typeof BASE_STICKER_STORE> = {}) {
  (useStickerStore as unknown as jest.Mock).mockReturnValue({
    ...BASE_STICKER_STORE,
    ...stickerOverrides,
  });
  (useAuthStore as unknown as jest.Mock).mockReturnValue(BASE_AUTH_STORE);
  (useUserSettingsStore as unknown as jest.Mock).mockReturnValue(BASE_USER_SETTINGS_STORE);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen - headerRight padding', () => {
  it('headerRight container has paddingRight >= 48 to clear profile button', () => {
    setupMocks({
      userAlbums: [{ id: 'album-1', name: 'My Album' }],
      activeUserAlbumId: 'album-1',
    });
    const { getByTestId } = render(<HomeScreen />);
    const headerRight = getByTestId('header-right');
    expect(headerRight).toHaveStyle({ paddingRight: 56 });
  });

  it('paddingRight value is at least 48 (profile button width + margin)', () => {
    setupMocks();
    const { getByTestId } = render(<HomeScreen />);
    const headerRight = getByTestId('header-right');
    const style = headerRight.props.style;
    const paddingRight = Array.isArray(style)
      ? style.reduce((acc: number, s: object) => {
          const v = (s as Record<string, number>).paddingRight;
          return v !== undefined ? v : acc;
        }, 0)
      : (style as Record<string, number>).paddingRight;
    expect(paddingRight).toBeGreaterThanOrEqual(48);
  });
});
