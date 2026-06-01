import React, { useContext } from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { CatalogProvider } from '@core/providers/CatalogProvider';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { useSyncStore } from '@shared/store/syncStore';
import { Text, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingContext } from '@core/providers/OnboardingContext';
import { STORAGE_KEYS } from '@shared/storage/keys';

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
    loadCacheLocally: jest.fn().mockResolvedValue(null),
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

const mockOfflineQueueInit = require('@shared/services/offlineQueueService').offlineQueueService.init as jest.Mock;
const mockSyncStart = require('@shared/services/syncService').syncService.start as jest.Mock;
const mockSyncStop = require('@shared/services/syncService').syncService.stop as jest.Mock;
const mockOfflineQueueClear = require('@shared/services/offlineQueueService').offlineQueueService.clear as jest.Mock;
const mockGetCurrentUser = require('@modules/auth/services/authService').authService.getCurrentUser as jest.Mock;
const mockUserAlbumList = require('@shared/services/userAlbumService').userAlbumService.list as jest.Mock;

function TestChild() {
  return <Text>test child</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
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

  mockOfflineQueueInit.mockResolvedValue(undefined);
  mockGetCurrentUser.mockResolvedValue(null);
  mockUserAlbumList.mockResolvedValue([{ id: 'album-1', name: 'Test Album' }]);
});

afterEach(() => {
  mockOnAuthChangeHandler = null;
});

describe('CatalogProvider bootstrap', () => {
  it('calls offlineQueueService.init on mount', async () => {
    render(
      <CatalogProvider>
        <TestChild />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(mockOfflineQueueInit).toHaveBeenCalledTimes(1);
    });
  });

  it('starts syncService when user is authenticated on mount', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
    });

    render(
      <CatalogProvider>
        <TestChild />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(mockSyncStart).toHaveBeenCalledWith('user-1');
    });
  });

  it('does not start syncService when no user on mount', async () => {
    render(
      <CatalogProvider>
        <TestChild />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(mockSyncStart).not.toHaveBeenCalled();
    });
  });
});

describe('CatalogProvider auth listener', () => {
  it('stops sync and clears queue on SIGNED_OUT', async () => {
    render(
      <CatalogProvider>
        <TestChild />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(mockOnAuthChangeHandler).not.toBeNull();
    });

    await act(async () => {
      mockOnAuthChangeHandler!('SIGNED_OUT', null);
    });

    expect(mockSyncStop).toHaveBeenCalledTimes(1);
    expect(mockOfflineQueueClear).toHaveBeenCalledTimes(1);
  });

  it('renders SyncStatusBar in the layout', async () => {
    useSyncStore.setState({ status: 'offline', pendingCount: 0 });
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
    });

    const { findByText } = render(
      <CatalogProvider>
        <TestChild />
      </CatalogProvider>,
    );

    expect(await findByText('Sem conexão')).toBeTruthy();
  });
});

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

describe('CatalogProvider onboarding flag', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  afterEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => Promise.resolve(null));
    (AsyncStorage.setItem as jest.Mock).mockImplementation(() => Promise.resolve(undefined));
  });

  it('shows onboarding when ONBOARDING_DONE is absent (first launch)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });
  });

  it('hides onboarding when ONBOARDING_DONE is true (subsequent launch)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('false');
    });
  });

  it('completeOnboarding writes ONBOARDING_DONE as true and hides modal', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

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
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_DONE, 'true');
      expect(getByTestId('onboarding-show')).toHaveTextContent('false');
    });
  });

  it('restartTutorial clears flag and shows modal', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(
      <CatalogProvider>
        <OnboardingConsumer />
      </CatalogProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('onboarding-show')).toHaveTextContent('false');
    });

    fireEvent.press(getByTestId('onboarding-restart'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_DONE, '');
      expect(getByTestId('onboarding-show')).toHaveTextContent('true');
    });
  });
});
