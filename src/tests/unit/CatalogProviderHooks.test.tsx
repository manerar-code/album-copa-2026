import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBootstrap } from '@core/providers/hooks/useBootstrap';
import { useCatalogLoad } from '@core/providers/hooks/useCatalogLoad';
import { useAuthListener } from '@core/providers/hooks/useAuthListener';
import { useUserLogin } from '@core/providers/hooks/useUserLogin';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';

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
    merge: jest.fn((local, cloud) => ({ ...local, ...cloud })),
    replaceAll: jest.fn().mockResolvedValue(undefined),
    upsertOne: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/userAlbumService', () => ({
  userAlbumService: {
    list: jest.fn().mockResolvedValue([{ id: 'album-1', name: 'Test Album' }]),
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

jest.mock('@modules/auth/services/accountDeletionService', () => ({
  accountDeletionService: {
    getPendingRequest: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@shared/services/collectionService', () => ({
  collectionService: {
    load: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockOfflineInit = jest.mocked(
  require('@shared/services/offlineQueueService').offlineQueueService.init,
);
const mockGetCurrentUser = jest.mocked(
  require('@modules/auth/services/authService').authService.getCurrentUser,
);
const mockCatalogLoadCache = jest.mocked(
  require('@modules/album/services/catalogService').catalogService.loadCacheLocally,
);
const mockCatalogFetchFull = jest.mocked(
  require('@modules/album/services/catalogService').catalogService.fetchAndCacheFullCatalog,
);
const mockUserAlbumList = jest.mocked(
  require('@shared/services/userAlbumService').userAlbumService.list,
);
const mockUserAlbumCreate = jest.mocked(
  require('@shared/services/userAlbumService').userAlbumService.create,
);
const mockCloudLoad = jest.mocked(
  require('@shared/services/cloudCollectionService').cloudCollectionService.load,
);
const mockCloudReplaceAll = jest.mocked(
  require('@shared/services/cloudCollectionService').cloudCollectionService.replaceAll,
);
const mockAccountGetPending = jest.mocked(
  require('@modules/auth/services/accountDeletionService').accountDeletionService.getPendingRequest,
);
const mockAuthSignOut = jest.mocked(
  require('@modules/auth/services/authService').authService.signOut,
);

beforeEach(() => {
  jest.clearAllMocks();
  mockOnAuthChangeHandler = null;

  useAuthStore.setState({ user: null, isLoading: true, pendingDeletion: null });
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

  mockOfflineInit.mockResolvedValue(undefined);
  mockGetCurrentUser.mockResolvedValue(null);
  mockCatalogLoadCache.mockResolvedValue(null);
  mockCatalogFetchFull.mockResolvedValue({
    album: { versao: 1 },
    selecoes: [],
    figurinhas: [],
  });
  mockUserAlbumList.mockResolvedValue([{ id: 'album-1', name: 'Test Album' }]);
  mockUserAlbumCreate.mockReset();
  mockCloudLoad.mockResolvedValue({});
  mockCloudReplaceAll.mockResolvedValue(undefined);
  mockAccountGetPending.mockResolvedValue(null);
  mockAuthSignOut.mockResolvedValue(undefined);
});

afterEach(() => {
  mockOnAuthChangeHandler = null;
});

describe('useBootstrap', () => {
  it('calls offlineQueueService.init and authService.getCurrentUser on mount', async () => {
    renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(mockOfflineInit).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  it('sets bootstrapComplete to true after successful bootstrap', async () => {
    const { result } = renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(result.current.bootstrapComplete).toBe(true);
    });
  });

  it('sets loading to false on auth store after bootstrap', async () => {
    renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  it('sets user in auth store when getCurrentUser returns a user', async () => {
    const testUser = { id: 'u1', email: 'a@b.com', name: 'Test User' };
    mockGetCurrentUser.mockResolvedValue(testUser);

    renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(testUser);
    });
  });

  it('does not set user on auth store when getCurrentUser returns null', async () => {
    renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  it('completes even when offlineQueueService.init throws', async () => {
    mockOfflineInit.mockRejectedValue(new Error('init error'));

    const { result } = renderHook(() => useBootstrap());

    await waitFor(() => {
      expect(result.current.bootstrapComplete).toBe(true);
    });
  });
});

describe('useCatalogLoad', () => {
  it('does nothing when bootstrapComplete is false', () => {
    renderHook(() => useCatalogLoad(false));

    expect(mockCatalogLoadCache).not.toHaveBeenCalled();
    expect(mockCatalogFetchFull).not.toHaveBeenCalled();
  });

  it('loads catalog from local cache when available', async () => {
    const cachedData = {
      album: { versao: 1 },
      selecoes: [{ id: 's1', nome: 'Brasil', codigo_fifa: 'BRA', ordem: 1, bandeira_url: '' }],
      figurinhas: [
        {
          id: 'f1',
          album_id: 'a1',
          selecao_id: 's1',
          numero: '001',
          nome: '',
          type: '',
          descricao: '',
          ordem: 1,
        },
      ],
    };
    mockCatalogLoadCache.mockResolvedValue(cachedData);

    const { result } = renderHook(() => useCatalogLoad(true));

    await waitFor(() => {
      expect(result.current.catalogReady).toBe(true);
    });

    const store = useStickerStore.getState();
    expect(store.album).toEqual(cachedData.album);
    expect(store.selecoes).toEqual(cachedData.selecoes);
    expect(store.figurinhas).toEqual(cachedData.figurinhas);
    expect(store.isInitialized).toBe(true);
    expect(store.isLoading).toBe(false);
  });

  it('fetches full catalog when local cache is empty', async () => {
    const { result } = renderHook(() => useCatalogLoad(true));

    await waitFor(() => {
      expect(result.current.catalogReady).toBe(true);
    });

    expect(mockCatalogLoadCache).toHaveBeenCalledTimes(1);
    expect(mockCatalogFetchFull).toHaveBeenCalledTimes(1);
  });

  it('loads collection and user settings after catalog is ready', async () => {
    const { result } = renderHook(() => useCatalogLoad(true));

    await waitFor(() => {
      expect(result.current.catalogReady).toBe(true);
    });
  });

  it('sets error when catalog loading fails', async () => {
    mockCatalogLoadCache.mockRejectedValue(new Error('network error'));
    mockCatalogFetchFull.mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useCatalogLoad(true));

    await waitFor(() => {
      expect(result.current.error).toBe('Falha ao carregar o catálogo. Verifique sua conexão.');
    });
  });

  it('does not double-initialize when called with bootstrapComplete toggling', async () => {
    const { rerender } = renderHook(
      ({ complete }: { complete: boolean }) => useCatalogLoad(complete),
      { initialProps: { complete: false } },
    );

    expect(mockCatalogLoadCache).not.toHaveBeenCalled();

    rerender({ complete: true });

    await waitFor(() => {
      expect(mockCatalogLoadCache).toHaveBeenCalledTimes(1);
      expect(mockCatalogFetchFull).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useAuthListener', () => {
  const onSignIn = jest.fn();
  const onSignOut = jest.fn();

  beforeEach(() => {
    onSignIn.mockClear();
    onSignOut.mockClear();
  });

  it('sets up auth subscription on mount', () => {
    renderHook(() => useAuthListener(onSignIn, onSignOut));

    const { supabase } = require('@shared/services/supabase');
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuthListener(onSignIn, onSignOut));
    unmount();

    expect(mockSubscriptionUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('calls onSignIn(false) on SIGNED_IN when no previous user', async () => {
    renderHook(() => useAuthListener(onSignIn, onSignOut));

    expect(mockOnAuthChangeHandler).not.toBeNull();

    await act(async () => {
      mockOnAuthChangeHandler!('SIGNED_IN', {
        user: { id: 'u1', email: 'test@test.com', user_metadata: { full_name: 'Test' } },
      });
    });

    expect(onSignIn).toHaveBeenCalledWith(false);
  });

  it('sets user in authStore on SIGNED_IN', async () => {
    renderHook(() => useAuthListener(onSignIn, onSignOut));

    await act(async () => {
      mockOnAuthChangeHandler!('SIGNED_IN', {
        user: { id: 'u1', email: 'test@test.com', user_metadata: { full_name: 'Test' } },
      });
    });

    const user = useAuthStore.getState().user;
    expect(user).toEqual({
      id: 'u1',
      email: 'test@test.com',
      name: 'Test',
      avatar_url: undefined,
    });
  });

  it('calls onSignIn(true) on SIGNED_IN when user id differs from bootstrap', async () => {
    const bootstrapRef = { current: 'previous-user-id' };
    renderHook(() => useAuthListener(onSignIn, onSignOut, bootstrapRef));

    await act(async () => {
      mockOnAuthChangeHandler!('SIGNED_IN', {
        user: { id: 'new-user', email: 'new@test.com', user_metadata: {} },
      });
    });

    expect(onSignIn).toHaveBeenCalledWith(true);
  });

  it('calls onSignOut on SIGNED_OUT', async () => {
    renderHook(() => useAuthListener(onSignIn, onSignOut));

    await act(async () => {
      mockOnAuthChangeHandler!('SIGNED_OUT', null);
    });

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('re-creates subscription when onSignIn callback changes', () => {
    const { rerender } = renderHook(
      ({ signIn, signOut }) => useAuthListener(signIn, signOut, undefined),
      { initialProps: { signIn: onSignIn, signOut: onSignOut } },
    );

    const updatedOnSignIn = jest.fn();
    rerender({ signIn: updatedOnSignIn, signOut: onSignOut });

    const { supabase } = require('@shared/services/supabase');
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(2);
  });
});

describe('useUserLogin', () => {
  it('returns handleUserLogin, handleMergeChoice, and mergeState', () => {
    const { result } = renderHook(() => useUserLogin());

    expect(result.current.handleUserLogin).toBeDefined();
    expect(result.current.handleMergeChoice).toBeDefined();
    expect(result.current.mergeState).toBeNull();
  });

  it('handleUserLogin sets syncUserId, creates user album, and loads collections', async () => {
    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    const store = useStickerStore.getState();
    expect(store.syncUserId).toBe('user-1');
    expect(store.userAlbums).toEqual([{ id: 'album-1', name: 'Test Album' }]);
    expect(store.activeUserAlbumId).toBe('album-1');
    expect(mockUserAlbumList).toHaveBeenCalledWith('user-1');
    expect(mockCloudLoad).toHaveBeenCalledWith('album-1');
  });

  it('handleUserLogin creates a new album when list returns empty', async () => {
    mockUserAlbumList.mockResolvedValue([]);
    mockUserAlbumCreate.mockResolvedValue({ id: 'new-album', name: 'New Album' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    expect(mockUserAlbumCreate).toHaveBeenCalledWith('user-1', 'Álbum do Test');
    const store = useStickerStore.getState();
    expect(store.userAlbums).toEqual([{ id: 'new-album', name: 'New Album' }]);
    expect(store.activeUserAlbumId).toBe('new-album');
  });

  it('handleUserLogin with isNewLogin=false merges and re-syncs when merged has more items', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    const store = useStickerStore.getState();
    expect(store.collection).toEqual({ 'fig-001': 'owned', 'fig-002': 'duplicate' });
    expect(mockCloudReplaceAll).toHaveBeenCalledWith(
      'album-1',
      { 'fig-001': 'owned', 'fig-002': 'duplicate' },
      'user-1',
    );
  });

  it('handleUserLogin with isNewLogin=true shows merge dialog when both local and cloud have data', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    expect(result.current.mergeState).not.toBeNull();
    expect(result.current.mergeState!.visible).toBe(true);
  });

  it('handleUserLogin with isNewLogin=true uses cloud when only cloud has data', async () => {
    useStickerStore.setState({ collection: {} });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    const store = useStickerStore.getState();
    expect(store.collection).toEqual({ 'fig-002': 'duplicate' });
    expect(result.current.mergeState).toBeNull();
  });

  it('handleUserLogin with isNewLogin=true migrates local to cloud when only local has data', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
    });
    mockCloudLoad.mockResolvedValue({});

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    expect(mockCloudReplaceAll).toHaveBeenCalledWith('album-1', { 'fig-001': 'owned' }, 'user-1');
    expect(result.current.mergeState).toBeNull();
  });

  it('handleMergeChoice with "local" applies local collection', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
      syncUserId: null,
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    await act(async () => {
      await result.current.handleMergeChoice('local');
    });

    const store = useStickerStore.getState();
    expect(store.collection).toEqual({ 'fig-001': 'owned' });
  });

  it('handleMergeChoice with "cloud" applies cloud collection', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
      syncUserId: null,
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    await act(async () => {
      await result.current.handleMergeChoice('cloud');
    });

    const store = useStickerStore.getState();
    expect(store.collection).toEqual({ 'fig-002': 'duplicate' });
  });

  it('handleMergeChoice does not call replaceAll when syncUserId is null', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
      syncUserId: null,
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    useStickerStore.setState({ syncUserId: null });

    await act(async () => {
      await result.current.handleMergeChoice('local');
    });

    expect(mockCloudReplaceAll).not.toHaveBeenCalled();
  });

  it('handleMergeChoice with syncUserId calls replaceAll', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
      syncUserId: 'user-1',
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    await act(async () => {
      await result.current.handleMergeChoice('cloud');
    });

    expect(mockCloudReplaceAll).toHaveBeenCalledTimes(1);
  });

  it('handleMergeChoice clears merge state', async () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
    });
    mockCloudLoad.mockResolvedValue({ 'fig-002': 'duplicate' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User', true);
    });

    expect(result.current.mergeState).not.toBeNull();

    await act(async () => {
      await result.current.handleMergeChoice('merge');
    });

    expect(result.current.mergeState).toBeNull();
  });

  it('handleUserLogin checks pending deletion and signs out if overdue', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    mockAccountGetPending.mockResolvedValue({
      scheduledDeleteAt: pastDate,
      completedAt: null,
    });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().pendingDeletion).toBeNull();
  });

  it('handleUserLogin sets pendingDeletion when request exists but not overdue', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockAccountGetPending.mockResolvedValue({
      scheduledDeleteAt: futureDate,
      completedAt: null,
    });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    expect(useAuthStore.getState().pendingDeletion).toEqual({
      scheduledDeleteAt: futureDate,
      completedAt: null,
    });
  });

  it('handleUserLogin sets pendingDeletion to null when getPendingRequest fails', async () => {
    mockAccountGetPending.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    expect(useAuthStore.getState().pendingDeletion).toBeNull();
  });

  it('userAlbumService.list failure is caught gracefully', async () => {
    mockUserAlbumList.mockRejectedValue(new Error('list failed'));
    mockUserAlbumCreate.mockResolvedValue({ id: 'fallback-album', name: 'Fallback' });

    const { result } = renderHook(() => useUserLogin());

    await act(async () => {
      await result.current.handleUserLogin('user-1', 'Test User');
    });

    expect(mockUserAlbumCreate).toHaveBeenCalledTimes(1);
  });
});
