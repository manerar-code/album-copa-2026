import { supabase } from './supabase';
import { handleError } from './errorHandler';
import type { UserCollection, StickerStatus } from '@shared/types';

export const cloudCollectionService = {
  async load(userAlbumId: string): Promise<UserCollection> {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('figurinha_id, status')
        .eq('user_album_id', userAlbumId);
      if (error) throw error;
      const collection: UserCollection = {};
      for (const row of data ?? []) {
        collection[row.figurinha_id] = row.status as StickerStatus;
      }
      return collection;
    } catch (error) {
      throw handleError(error, 'cloudCollectionService.load');
    }
  },

  async upsertOne(userAlbumId: string, figurinhaId: string, status: StickerStatus, userId: string): Promise<void> {
    try {
      if (status === 'missing') {
        await supabase
          .from('user_collections')
          .delete()
          .eq('user_album_id', userAlbumId)
          .eq('figurinha_id', figurinhaId);
      } else {
        const { error } = await supabase
          .from('user_collections')
          .upsert(
            {
              user_id: userId,
              user_album_id: userAlbumId,
              figurinha_id: figurinhaId,
              status,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_album_id,figurinha_id' },
          );
        if (error) throw error;
      }
    } catch (error) {
      throw handleError(error, 'cloudCollectionService.upsertOne');
    }
  },

  async replaceAll(userAlbumId: string, collection: UserCollection, userId: string): Promise<void> {
    try {
      await supabase.from('user_collections').delete().eq('user_album_id', userAlbumId);
      const rows = Object.entries(collection)
        .filter(([, status]) => status !== 'missing')
        .map(([figurinha_id, status]) => ({
          user_id: userId,
          user_album_id: userAlbumId,
          figurinha_id,
          status,
          updated_at: new Date().toISOString(),
        }));
      if (rows.length > 0) {
        await supabase.from('user_collections').insert(rows);
      }
    } catch (error) {
      throw handleError(error, 'cloudCollectionService.replaceAll');
    }
  },

  merge(local: UserCollection, cloud: UserCollection): UserCollection {
    const priority: Record<StickerStatus, number> = { missing: 0, owned: 1, duplicate: 2 };
    const all = new Set([...Object.keys(local), ...Object.keys(cloud)]);
    const merged: UserCollection = {};
    for (const id of all) {
      const l = local[id] ?? 'missing';
      const c = cloud[id] ?? 'missing';
      merged[id] = priority[l] >= priority[c] ? l : c;
    }
    return merged;
  },
};
