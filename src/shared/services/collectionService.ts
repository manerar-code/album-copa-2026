import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '@shared/services/errorHandler';
import type { UserCollection } from '@shared/types';

// Scoped per album so different accounts on the same device never share data.
const collectionKey = (userAlbumId: string) => `user_collection_${userAlbumId}`;

export const collectionService = {
  async save(collection: UserCollection, userAlbumId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(collectionKey(userAlbumId), JSON.stringify(collection));
    } catch (error) {
      throw handleError(error, 'collectionService.save');
    }
  },

  async load(userAlbumId: string): Promise<UserCollection> {
    try {
      const raw = await AsyncStorage.getItem(collectionKey(userAlbumId));
      return raw ? (JSON.parse(raw) as UserCollection) : {};
    } catch (error) {
      throw handleError(error, 'collectionService.load');
    }
  },

  async reset(userAlbumId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(collectionKey(userAlbumId));
    } catch (error) {
      throw handleError(error, 'collectionService.reset');
    }
  },
};
