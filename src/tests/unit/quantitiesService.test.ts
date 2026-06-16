import AsyncStorage from '@react-native-async-storage/async-storage';
import { quantitiesService } from '@shared/services/quantitiesService';

jest.mock('@react-native-async-storage/async-storage');
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('quantitiesService', () => {
  it('save serializes and stores quantities under user_quantities_<albumId>', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await quantitiesService.save({ 'fig-007': 2, 'fig-010': 3 }, 'album-1');
    expect(mockSetItem).toHaveBeenCalledWith(
      'user_quantities_album-1',
      JSON.stringify({ 'fig-007': 2, 'fig-010': 3 }),
    );
  });

  it('load returns parsed quantities object when key exists', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ 'fig-007': 2 }));
    const result = await quantitiesService.load('album-1');
    expect(result).toEqual({ 'fig-007': 2 });
  });

  it('load returns {} when AsyncStorage key is absent', async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await quantitiesService.load('album-1');
    expect(result).toEqual({});
  });

  it('reset removes the scoped key from AsyncStorage', async () => {
    mockRemoveItem.mockResolvedValue(undefined);
    await quantitiesService.reset('album-1');
    expect(mockRemoveItem).toHaveBeenCalledWith('user_quantities_album-1');
  });

  it('save followed by load round-trips the same object', async () => {
    const data = { 'fig-007': 2, 'fig-010': 3 };
    mockSetItem.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue(JSON.stringify(data));
    await quantitiesService.save(data, 'album-1');
    const result = await quantitiesService.load('album-1');
    expect(result).toEqual(data);
  });
});
