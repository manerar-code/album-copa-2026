import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '@shared/services/errorHandler';

// Scoped per album so different accounts on the same device never share data.
const quantitiesKey = (userAlbumId: string) => `user_quantities_${userAlbumId}`;

export const quantitiesService = {
  async save(quantities: Record<string, number>, userAlbumId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(quantitiesKey(userAlbumId), JSON.stringify(quantities));
    } catch (error) {
      throw handleError(error, 'quantitiesService.save');
    }
  },

  async load(userAlbumId: string): Promise<Record<string, number>> {
    try {
      const raw = await AsyncStorage.getItem(quantitiesKey(userAlbumId));
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch (error) {
      throw handleError(error, 'quantitiesService.load');
    }
  },

  async reset(userAlbumId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(quantitiesKey(userAlbumId));
    } catch (error) {
      throw handleError(error, 'quantitiesService.reset');
    }
  },
};
