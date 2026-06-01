import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';
import { CatalogProvider } from '@core/providers/CatalogProvider';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { useSyncStore } from '@shared/store/syncStore';
import { OnboardingContext } from '@core/providers/OnboardingContext';

// Mock AsyncStorage with isolated storage per test file
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve(undefined);
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve(undefined);
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
      return Promise.resolve(undefined);
    }),
  };
});

let mockOnAuthChangeHandler: ((event: string, session: unknown) => void) | null = null;
let mockSubscriptionUnsubscribe: jest.Mock;

jest.mock('@shared/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn((handler: (event: string, session: unknown) => void) => {
        mockOnAuthChangeHandler = handler;
        mockSubscriptionUnsubscribe = jest.fn();
        return { data: { subscription: { unsubscribe: mockSubscriptionUnsubscribe } } };
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

jest.mock('@modules/album/services/catalogService', () => ({
  catalogService: {
    loadCacheLocally: jest.fn().mockResolvedValue({
      album: { versao: 1 },
      selecoes: [],
      figurinhas: [],
    }),
    checkVersion: jest.fn().mockResolvedValue(null),
    fetchAndCacheFullCatalog: jest.fn().mockResolvedValue({
      album: { versao: 1 },
      selecoes: [],
      figurinhas: [],
    }),
  },
}));

jest.mock('@modules/auth/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: {
    load: jest.fn().mockResolvedValue({}),
    merge: jest.fn(),
    replaceAll: jest.fn().mockResolvedValue(undefined),
    upsertOne: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/userAlbumService', () => ({
  userAlbumService: {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  },
}));

jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: {
    init: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    enqueue: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/syncService', () => ({
  syncService: {
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

jest.mock('@shared/services/collectionService', () => ({
  collectionService: {
    load: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  },
}));

function OnboardingConsumer() {
  const ctx = useContext(OnboardingContext);
  return (
    <View>
      <Text testID="onboarding-show">{ctx.showOnboarding ? 'true' : 'false'}</Text>
      <TouchableOpacity testID="onboarding-complete" onPress={ctx.completeOnboarding} />
      <TouchableOpacity testID="onboarding-restart" onPress={ctx.restartTutorial} />
    </View>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockOnAuthChangeHandler = null;

  useAuthStore.setState({ user: null, isLoading: true });
  useStickerStore.setState({
    album: null,
    figurinhas: [],
    selecoes: [],
    collection: {},
    isLoading: false,
    isInitialized: false,
    syncUserId: null,
    userAlbums: [],
    activeUserAlbumId: null,
    allCollections: {},
  });
  useUserSettingsStore.setState({ trackedTypes: null });
  useSyncStore.setState({ status: 'synced', pendingCount: 0 });
});

afterEach(() => {
  mockOnAuthChangeHandler = null;
});

describe('Onboarding integration — first launch', () => {
  it('shows onboarding when ONBOARDING_DONE is absent', async () => {
    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });
  });

  it('hides onboarding after completeOnboarding is called', async () => {
    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });

    fireEvent.press(getByTestId('onboarding-complete'));

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('false');
    });
  });
});

describe('Onboarding integration — restart tutorial', () => {
  it('restartTutorial shows the modal again after completing', async () => {
    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });

    fireEvent.press(getByTestId('onboarding-complete'));

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('false');
    });

    fireEvent.press(getByTestId('onboarding-restart'));

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });
  });
});
