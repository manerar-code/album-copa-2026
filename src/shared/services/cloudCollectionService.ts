import { supabase } from './supabase';
import { handleError } from './errorHandler';
import type { UserCollection, StickerStatus } from '@shared/types';

export const cloudCollectionService = {
  /** Carrega coleção do usuário logado do Supabase */
  async load(userId: string): Promise<UserCollection> {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('figurinha_id, status')
        .eq('user_id', userId);
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

  /** Persiste um único status de figurinha no Supabase */
  async upsertOne(userId: string, figurinhaId: string, status: StickerStatus): Promise<void> {
    try {
      if (status === 'missing') {
        // 'missing' é o default — apaga o registro para economizar espaço
        await supabase
          .from('user_collections')
          .delete()
          .eq('user_id', userId)
          .eq('figurinha_id', figurinhaId);
      } else {
        await supabase
          .from('user_collections')
          .upsert(
            {
              user_id: userId,
              figurinha_id: figurinhaId,
              status,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,figurinha_id' },
          );
      }
    } catch (error) {
      throw handleError(error, 'cloudCollectionService.upsertOne');
    }
  },

  /** Substitui toda a coleção na nuvem (usado na migração) */
  async replaceAll(userId: string, collection: UserCollection): Promise<void> {
    try {
      // Apaga tudo do usuário
      await supabase.from('user_collections').delete().eq('user_id', userId);
      // Insere os não-missing
      const rows = Object.entries(collection)
        .filter(([, status]) => status !== 'missing')
        .map(([figurinha_id, status]) => ({
          user_id: userId,
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

  /** Mescla local + nuvem: para cada figurinha, o status mais "avançado" vence */
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
