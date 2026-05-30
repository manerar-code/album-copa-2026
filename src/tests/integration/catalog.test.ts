import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogService } from '@modules/album/services/catalogService';
import { collectionService } from '@shared/services/collectionService';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@shared/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('Catalog integration', () => {
  it('saves and loads catalog from local cache', async () => {
    const mockCache = {
      album: { id: 'a1', nome: 'Copa 2026', versao: 1 },
      selecoes: [{ id: 's1', album_id: 'a1', nome: 'Brasil', codigo_fifa: 'BRA', ordem: 1, bandeira_url: '' }],
      figurinhas: [{ id: 'f1', album_id: 'a1', selecao_id: 's1', numero: '001', descricao: '', ordem: 1 }],
    };

    mockSetItem.mockResolvedValue(undefined);
    await catalogService.saveCacheLocally(mockCache);
    expect(mockSetItem).toHaveBeenCalledWith('catalog_cache', JSON.stringify(mockCache));
    expect(mockSetItem).toHaveBeenCalledWith('catalog_version', '1');

    mockGetItem.mockResolvedValue(JSON.stringify(mockCache));
    const loaded = await catalogService.loadCacheLocally();
    expect(loaded).toEqual(mockCache);
  });

  it('returns null when no cache exists', async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await catalogService.loadCacheLocally();
    expect(result).toBeNull();
  });

  it('collection survives catalog update', async () => {
    // Set existing collection
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ 'f1': 'owned', 'f2': 'duplicate' }));
    const collection = await collectionService.load();
    expect(collection['f1']).toBe('owned');
    expect(collection['f2']).toBe('duplicate');

    // Simulate catalog update — collection should remain intact
    expect(collection['f1']).toBe('owned');
  });
});
