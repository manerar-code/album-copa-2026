import { act, renderHook } from '@testing-library/react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { collectionService } from '@shared/services/collectionService';
import { quantitiesService } from '@shared/services/quantitiesService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { useSyncStore } from '@shared/store/syncStore';

jest.mock('@shared/services/collectionService');
jest.mock('@shared/services/quantitiesService');
jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: { upsertOne: jest.fn() },
}));
jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: { enqueue: jest.fn() },
}));

const mockSave = collectionService.save as jest.Mock;
const mockLoad = collectionService.load as jest.Mock;
const mockReset = collectionService.reset as jest.Mock;
const mockQtySave = quantitiesService.save as jest.Mock;
const mockQtyLoad = quantitiesService.load as jest.Mock;
const mockQtyReset = quantitiesService.reset as jest.Mock;
const mockUpsertOne = cloudCollectionService.upsertOne as jest.Mock;
const mockEnqueue = offlineQueueService.enqueue as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoad.mockResolvedValue({});
  mockSave.mockResolvedValue(undefined);
  mockReset.mockResolvedValue(undefined);
  mockQtyLoad.mockResolvedValue({});
  mockQtySave.mockResolvedValue(undefined);
  mockQtyReset.mockResolvedValue(undefined);
  mockUpsertOne.mockResolvedValue(undefined);
  mockEnqueue.mockResolvedValue(undefined);
  useSyncStore.setState({ status: 'synced', pendingCount: 0 });
  useStickerStore.setState({
    collection: {},
    quantities: {},
    figurinhas: [],
    selecoes: [],
    album: null,
    activeUserAlbumId: null,
    syncUserId: null,
  });
});

describe('stickerStore', () => {
  describe('getCrossAlbumDuplicateSources', () => {
    beforeEach(() => {
      useStickerStore.setState({
        allCollections: {
          'album-active': { 'fig-001': 'missing', 'fig-002': 'owned', 'fig-004': 'duplicate' },
          'album-b': { 'fig-001': 'duplicate', 'fig-003': 'missing' },
          'album-c': { 'fig-001': 'duplicate', 'fig-002': 'owned' },
        },
        activeUserAlbumId: 'album-active',
      });
    });

    it('returns album IDs where sticker is duplicate in other albums', () => {
      const { result } = renderHook(() => useStickerStore());
      expect(result.current.getCrossAlbumDuplicateSources('fig-001')).toEqual([
        'album-b',
        'album-c',
      ]);
    });

    it('excludes the active album from results', () => {
      const { result } = renderHook(() => useStickerStore());
      const sources = result.current.getCrossAlbumDuplicateSources('fig-004');
      expect(sources).toEqual([]);
    });

    it('returns empty array when sticker is not duplicate in any other album', () => {
      const { result } = renderHook(() => useStickerStore());
      expect(result.current.getCrossAlbumDuplicateSources('fig-003')).toEqual([]);
    });

    it('returns empty array when sticker is owned (not duplicate) in other albums', () => {
      const { result } = renderHook(() => useStickerStore());
      expect(result.current.getCrossAlbumDuplicateSources('fig-002')).toEqual([]);
    });

    it('returns empty array when no other albums exist', () => {
      useStickerStore.setState({ allCollections: {}, activeUserAlbumId: 'album-active' });
      const { result } = renderHook(() => useStickerStore());
      expect(result.current.getCrossAlbumDuplicateSources('fig-001')).toEqual([]);
    });
  });

  describe('setStatus with targetAlbumId', () => {
    const mockUpsertOne = cloudCollectionService.upsertOne as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockUpsertOne.mockResolvedValue(undefined);
      useStickerStore.setState({
        collection: { 'fig-001': 'missing' },
        allCollections: {
          'album-active': { 'fig-001': 'missing' },
          'album-b': { 'fig-001': 'duplicate' },
        },
        activeUserAlbumId: 'album-active',
        syncUserId: 'user-1',
      });
    });

    it('updates the target album collection in allCollections', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned', 'album-b');
      });
      expect(result.current.allCollections['album-b']['fig-001']).toBe('owned');
    });

    it('does NOT modify the active album collection', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned', 'album-b');
      });
      expect(result.current.collection['fig-001']).toBe('missing');
    });

    it('calls cloudCollectionService.upsertOne with target album ID', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned', 'album-b');
      });
      expect(mockUpsertOne).toHaveBeenCalledWith('album-b', 'fig-001', 'owned', 'user-1');
    });

    it('does NOT save to local collectionService when targeting other album', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned', 'album-b');
      });
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('updates active album when targetAlbumId is the active album', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned', 'album-active');
      });
      expect(result.current.collection['fig-001']).toBe('owned');
      expect(mockSave).toHaveBeenCalled();
    });

    it('updates active album when targetAlbumId is undefined (default behavior)', async () => {
      const { result } = renderHook(() => useStickerStore());
      await act(async () => {
        await result.current.setStatus('fig-001', 'owned');
      });
      expect(result.current.collection['fig-001']).toBe('owned');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // Original tests follow

  it('initial status of any sticker is missing', () => {
    const { result } = renderHook(() => useStickerStore());
    expect(result.current.getStatus('any-id')).toBe('missing');
  });

  it('toggleSticker cycles missing → owned → duplicate, then increments on duplicate', async () => {
    const { result } = renderHook(() => useStickerStore());
    const id = 'sticker-001';

    await act(async () => {
      await result.current.toggleSticker(id);
    });
    expect(result.current.getStatus(id)).toBe('owned');

    await act(async () => {
      await result.current.toggleSticker(id);
    });
    expect(result.current.getStatus(id)).toBe('duplicate');
    expect(result.current.getDupCount(id)).toBe(1);

    // When already duplicate, tap increments instead of cycling to missing
    await act(async () => {
      await result.current.toggleSticker(id);
    });
    expect(result.current.getStatus(id)).toBe('duplicate');
    expect(result.current.getDupCount(id)).toBe(2);
  });

  it('persists collection to storage on toggle when cycling (missing→owned→duplicate)', async () => {
    useStickerStore.setState({ activeUserAlbumId: 'album-1' });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => {
      await result.current.toggleSticker('001');
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ '001': 'owned' }, 'album-1');
  });

  it('persists quantities to storage when incrementing duplicate', async () => {
    const { result } = renderHook(() => useStickerStore());
    useStickerStore.setState({ activeUserAlbumId: 'album-1', collection: { '001': 'duplicate' } });

    await act(async () => {
      await result.current.toggleSticker('001');
    });
    // When already duplicate, increments and saves quantities
    expect(mockQtySave).toHaveBeenCalled();
    expect(result.current.getDupCount('001')).toBe(2);
  });

  it('loadCollection reads from storage', async () => {
    mockLoad.mockResolvedValue({ '002': 'owned', '003': 'duplicate' });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => {
      await result.current.loadCollection('album_1');
    });
    expect(result.current.getStatus('002')).toBe('owned');
    expect(result.current.getStatus('003')).toBe('duplicate');
  });

  it('getStats returns correct counts', () => {
    useStickerStore.setState({
      figurinhas: [
        {
          id: '1',
          album_id: 'a',
          selecao_id: 's',
          numero: '001',
          descricao: '',
          ordem: 1,
          nome: 'Player1',
          type: 'Player',
        },
        {
          id: '2',
          album_id: 'a',
          selecao_id: 's',
          numero: '002',
          descricao: '',
          ordem: 2,
          nome: 'Player2',
          type: 'Player',
        },
        {
          id: '3',
          album_id: 'a',
          selecao_id: 's',
          numero: '003',
          descricao: '',
          ordem: 3,
          nome: 'Player3',
          type: 'Player',
        },
      ],
      collection: { '1': 'owned', '2': 'duplicate' },
    });
    const { result } = renderHook(() => useStickerStore());
    const stats = result.current.getStats();
    expect(stats.total).toBe(3);
    expect(stats.owned).toBe(2); // owned + duplicate together
    expect(stats.duplicate).toBe(1);
    expect(stats.missing).toBe(1);
  });

  it('resetCollection clears collection, quantities and storage', async () => {
    useStickerStore.setState({
      collection: { '1': 'owned' },
      quantities: { '2': 3 },
      activeUserAlbumId: 'album-1',
    });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => {
      await result.current.resetCollection();
    });
    expect(result.current.collection).toEqual({});
    expect(result.current.quantities).toEqual({});
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockQtyReset).toHaveBeenCalledTimes(1);
  });

  describe('offline-aware toggleSticker', () => {
    beforeEach(() => {
      useStickerStore.setState({
        activeUserAlbumId: 'album-1',
        syncUserId: 'user-1',
        collection: {},
      });
    });

    it('when online (synced), calls cloudCollectionService.upsertOne', async () => {
      useSyncStore.setState({ status: 'synced' });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => {
        await result.current.toggleSticker('fig-001');
      });

      expect(result.current.getStatus('fig-001')).toBe('owned');
      expect(mockUpsertOne).toHaveBeenCalledWith('album-1', 'fig-001', 'owned', 'user-1');
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('when online (pending), calls cloudCollectionService.upsertOne', async () => {
      useSyncStore.setState({ status: 'pending' });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => {
        await result.current.toggleSticker('fig-001');
      });

      expect(mockUpsertOne).toHaveBeenCalledWith('album-1', 'fig-001', 'owned', 'user-1');
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('when offline, enqueues instead of cloud upsert', async () => {
      useSyncStore.setState({ status: 'offline' });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => {
        await result.current.toggleSticker('fig-001');
      });

      expect(result.current.getStatus('fig-001')).toBe('owned');
      expect(mockEnqueue).toHaveBeenCalledWith({
        userAlbumId: 'album-1',
        figurinhaId: 'fig-001',
        status: 'owned',
        createdAt: expect.any(Number),
      });
      expect(mockUpsertOne).not.toHaveBeenCalled();
    });

    it('local state is updated immediately (before enqueue completes)', async () => {
      useSyncStore.setState({ status: 'offline' });
      const { result } = renderHook(() => useStickerStore());

      const togglePromise = result.current.toggleSticker('fig-001');

      expect(result.current.getStatus('fig-001')).toBe('owned');

      await act(async () => {
        await togglePromise;
      });
    });

    it('when offline and already duplicate, increments count (does NOT enqueue or upsert)', async () => {
      useSyncStore.setState({ status: 'offline' });
      useStickerStore.setState({
        collection: { 'fig-001': 'duplicate' },
        activeUserAlbumId: 'album-1',
      });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => {
        await result.current.toggleSticker('fig-001');
      });

      // When already duplicate, increments instead of cycling to missing
      expect(result.current.getStatus('fig-001')).toBe('duplicate');
      expect(result.current.getDupCount('fig-001')).toBe(2);
      expect(mockEnqueue).not.toHaveBeenCalled();
      expect(mockUpsertOne).not.toHaveBeenCalled();
    });
  });

  describe('registerTrade', () => {
    beforeEach(() => {
      useStickerStore.setState({
        activeUserAlbumId: 'album-1',
        syncUserId: 'user-1',
        collection: {},
        quantities: {},
      });
    });

    it('duplicate qty=3 sent one → remains duplicate qty=2', async () => {
      useStickerStore.setState({
        collection: { 'fig-a': 'duplicate' },
        quantities: { 'fig-a': 3 },
      });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade(['fig-a'], []));
      expect(result.current.collection['fig-a']).toBe('duplicate');
      expect(result.current.quantities['fig-a']).toBe(2);
    });

    it('duplicate qty=2 sent one → transitions to owned (qty removed)', async () => {
      useStickerStore.setState({
        collection: { 'fig-a': 'duplicate' },
        quantities: { 'fig-a': 2 },
      });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade(['fig-a'], []));
      expect(result.current.collection['fig-a']).toBe('owned');
      expect(result.current.quantities['fig-a']).toBeUndefined();
    });

    it('duplicate qty=1 (no quantity entry) sent one → transitions to owned', async () => {
      useStickerStore.setState({ collection: { 'fig-a': 'duplicate' }, quantities: {} });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade(['fig-a'], []));
      expect(result.current.collection['fig-a']).toBe('owned');
    });

    it('owned sent one → transitions to missing', async () => {
      useStickerStore.setState({ collection: { 'fig-a': 'owned' }, quantities: {} });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade(['fig-a'], []));
      expect(result.current.collection['fig-a']).toBe('missing');
    });

    it('missing sent → no change (cannot send what you do not have)', async () => {
      useStickerStore.setState({ collection: { 'fig-a': 'missing' }, quantities: {} });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade(['fig-a'], []));
      expect(result.current.collection['fig-a']).toBe('missing');
    });

    it('received missing → becomes owned', async () => {
      useStickerStore.setState({ collection: {}, quantities: {} });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade([], ['fig-b']));
      expect(result.current.collection['fig-b']).toBe('owned');
    });

    it('received owned → no change', async () => {
      useStickerStore.setState({ collection: { 'fig-b': 'owned' }, quantities: {} });
      const { result } = renderHook(() => useStickerStore());
      await act(() => result.current.registerTrade([], ['fig-b']));
      expect(result.current.collection['fig-b']).toBe('owned');
    });
  });
});
