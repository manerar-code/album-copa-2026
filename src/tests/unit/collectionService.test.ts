import AsyncStorage from '@react-native-async-storage/async-storage';
import { collectionService } from '@shared/services/collectionService';

jest.mock('@react-native-async-storage/async-storage');
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('collectionService', () => {
  it('save serializes and stores collection', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await collectionService.save({ '001': 'owned', '002': 'missing' }, 'album_1');
    expect(mockSetItem).toHaveBeenCalledWith(
      'user_collection_album_1',
      JSON.stringify({ '001': 'owned', '002': 'missing' }),
    );
  });

  it('load returns parsed collection', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ '001': 'owned' }));
    const result = await collectionService.load('album_1');
    expect(result).toEqual({ '001': 'owned' });
  });

  it('load returns empty object when nothing stored', async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await collectionService.load('album_1');
    expect(result).toEqual({});
  });

  it('reset removes key from storage', async () => {
    mockRemoveItem.mockResolvedValue(undefined);
    await collectionService.reset('album_1');
    expect(mockRemoveItem).toHaveBeenCalledWith('user_collection_album_1');
  });
});
