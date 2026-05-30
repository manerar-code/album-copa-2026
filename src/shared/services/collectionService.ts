import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage/keys';
import { handleError } from '@shared/services/errorHandler';
import type { UserCollection } from '@shared/types';

export const collectionService = {
  async save(collection: UserCollection): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_COLLECTION, JSON.stringify(collection));
    } catch (error) {
      throw handleError(error, 'collectionService.save');
    }
  },

  async load(): Promise<UserCollection> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_COLLECTION);
      return raw ? (JSON.parse(raw) as UserCollection) : {};
    } catch (error) {
      throw handleError(error, 'collectionService.load');
    }
  },

  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_COLLECTION);
    } catch (error) {
      throw handleError(error, 'collectionService.reset');
    }
  },
};
