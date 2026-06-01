import { act, renderHook } from '@testing-library/react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { collectionService } from '@shared/services/collectionService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { useSyncStore } from '@shared/store/syncStore';

jest.mock('@shared/services/collectionService');
jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: { upsertOne: jest.fn() },
}));
jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: { enqueue: jest.fn() },
}));

const mockSave = collectionService.save as jest.Mock;
const mockLoad = collectionService.load as jest.Mock;
const mockReset = collectionService.reset as jest.Mock;
const mockUpsertOne = cloudCollectionService.upsertOne as jest.Mock;
const mockEnqueue = offlineQueueService.enqueue as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoad.mockResolvedValue({});
  mockSave.mockResolvedValue(undefined);
  mockReset.mockResolvedValue(undefined);
  mockUpsertOne.mockResolvedValue(undefined);
  mockEnqueue.mockResolvedValue(undefined);
  useSyncStore.setState({ status: 'synced', pendingCount: 0 });
  useStickerStore.setState({
    collection: {},
    figurinhas: [],
    selecoes: [],
    album: null,
    activeUserAlbumId: null,
    syncUserId: null,
  });
});

describe('stickerStore', () => {
  it('initial status of any sticker is missing', () => {
    const { result } = renderHook(() => useStickerStore());
    expect(result.current.getStatus('any-id')).toBe('missing');
  });

  it('toggleSticker cycles missing → owned → duplicate → missing', async () => {
    const { result } = renderHook(() => useStickerStore());
    const id = 'sticker-001';

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('owned');

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('duplicate');

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('missing');
  });

  it('persists to storage on every toggle', async () => {
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.toggleSticker('001'); });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ '001': 'owned' });
  });

  it('loadCollection reads from storage', async () => {
    mockLoad.mockResolvedValue({ '002': 'owned', '003': 'duplicate' });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.loadCollection(); });
    expect(result.current.getStatus('002')).toBe('owned');
    expect(result.current.getStatus('003')).toBe('duplicate');
  });

  it('getStats returns correct counts', () => {
    useStickerStore.setState({
      figurinhas: [
        { id: '1', album_id: 'a', selecao_id: 's', numero: '001', descricao: '', ordem: 1 },
        { id: '2', album_id: 'a', selecao_id: 's', numero: '002', descricao: '', ordem: 2 },
        { id: '3', album_id: 'a', selecao_id: 's', numero: '003', descricao: '', ordem: 3 },
      ],
      collection: { '1': 'owned', '2': 'duplicate' },
    });
    const { result } = renderHook(() => useStickerStore());
    const stats = result.current.getStats();
    expect(stats.total).toBe(3);
    expect(stats.owned).toBe(1);
    expect(stats.duplicate).toBe(1);
    expect(stats.missing).toBe(1);
  });

  it('resetCollection clears collection and storage', async () => {
    useStickerStore.setState({ collection: { '1': 'owned' } });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.resetCollection(); });
    expect(result.current.collection).toEqual({});
    expect(mockReset).toHaveBeenCalledTimes(1);
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

      await act(async () => { await result.current.toggleSticker('fig-001'); });

      expect(result.current.getStatus('fig-001')).toBe('owned');
      expect(mockUpsertOne).toHaveBeenCalledWith('album-1', 'fig-001', 'owned', 'user-1');
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('when online (pending), calls cloudCollectionService.upsertOne', async () => {
      useSyncStore.setState({ status: 'pending' });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => { await result.current.toggleSticker('fig-001'); });

      expect(mockUpsertOne).toHaveBeenCalledWith('album-1', 'fig-001', 'owned', 'user-1');
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('when offline, enqueues instead of cloud upsert', async () => {
      useSyncStore.setState({ status: 'offline' });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => { await result.current.toggleSticker('fig-001'); });

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

      await act(async () => { await togglePromise; });
    });

    it('when offline and status becomes missing, does NOT enqueue', async () => {
      useSyncStore.setState({ status: 'offline' });
      useStickerStore.setState({ collection: { 'fig-001': 'duplicate' } });
      const { result } = renderHook(() => useStickerStore());

      await act(async () => { await result.current.toggleSticker('fig-001'); });

      expect(result.current.getStatus('fig-001')).toBe('missing');
      expect(mockEnqueue).not.toHaveBeenCalled();
      expect(mockUpsertOne).not.toHaveBeenCalled();
    });
  });
});
