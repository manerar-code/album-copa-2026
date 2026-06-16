import { useStickerStore } from '@modules/album/store/stickerStore';
import { collectionService } from '@shared/services/collectionService';
import { quantitiesService } from '@shared/services/quantitiesService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';

jest.mock('@shared/services/collectionService', () => ({
  collectionService: { save: jest.fn(), load: jest.fn() },
}));
jest.mock('@shared/services/quantitiesService', () => ({
  quantitiesService: { save: jest.fn(), load: jest.fn() },
}));
jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: { upsertOne: jest.fn(), load: jest.fn() },
}));
jest.mock('@shared/store/syncStore', () => ({
  useSyncStore: { getState: () => ({ status: 'online' }) },
}));

const mockSave = collectionService.save as jest.Mock;
const mockQtySave = quantitiesService.save as jest.Mock;

describe('registerTrade store action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockQtySave.mockResolvedValue(undefined);
    (cloudCollectionService.upsertOne as jest.Mock).mockResolvedValue(undefined);

    useStickerStore.setState({
      collection: { 'fig-a': 'duplicate', 'fig-b': 'missing' },
      quantities: { 'fig-a': 2 },
      activeUserAlbumId: 'album-1',
      syncUserId: 'user-1',
      allCollections: {},
    });
  });

  it('calls collectionService.save exactly once regardless of list size', async () => {
    await useStickerStore.getState().registerTrade(['fig-a'], ['fig-b']);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('calls quantitiesService.save exactly once', async () => {
    await useStickerStore.getState().registerTrade(['fig-a'], ['fig-b']);
    expect(mockQtySave).toHaveBeenCalledTimes(1);
  });

  it('updates store state correctly after a successful trade', async () => {
    await useStickerStore.getState().registerTrade(['fig-a'], ['fig-b']);
    const { collection, quantities } = useStickerStore.getState();
    expect(quantities['fig-a']).toBe(1);
    expect(collection['fig-b']).toBe('owned');
  });

  it('reverts to pre-trade state when local save fails', async () => {
    mockSave.mockRejectedValueOnce(new Error('disk full'));
    const snapshot = { ...useStickerStore.getState().collection };

    await useStickerStore.getState().registerTrade(['fig-a'], ['fig-b']);

    expect(useStickerStore.getState().collection).toEqual(snapshot);
    expect(useStickerStore.getState().quantities).toEqual({ 'fig-a': 2 });
  });
});
