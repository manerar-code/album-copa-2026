import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@shared/services/supabase';
import { handleError } from '@shared/services/errorHandler';
import { STORAGE_KEYS } from '@shared/storage/keys';
import { logger } from '@shared/utils/logger';
import type { Album, Selecao, Figurinha } from '@shared/types';

interface CatalogCache {
  album: Album;
  selecoes: Selecao[];
  figurinhas: Figurinha[];
}

export const catalogService = {
  async checkVersion(): Promise<number | null> {
    try {
      const { data, error } = await supabase.from('albums').select('versao').single();
      if (error) throw error;
      return data?.versao ?? null;
    } catch (error) {
      throw handleError(error, 'catalogService.checkVersion');
    }
  },

  async getAlbum(): Promise<Album> {
    try {
      const { data, error } = await supabase.from('albums').select('*').single();
      if (error) throw error;
      return data as Album;
    } catch (error) {
      throw handleError(error, 'catalogService.getAlbum');
    }
  },

  async getTeams(albumId: string): Promise<Selecao[]> {
    try {
      const { data, error } = await supabase
        .from('selecoes')
        .select('*')
        .eq('album_id', albumId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as Selecao[];
    } catch (error) {
      throw handleError(error, 'catalogService.getTeams');
    }
  },

  async getStickers(albumId: string): Promise<Figurinha[]> {
    try {
      const PAGE = 1000;
      let all: Figurinha[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('figurinhas')
          .select('*')
          .eq('album_id', albumId)
          .order('ordem')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        all = all.concat((data ?? []) as Figurinha[]);
        if (!data || data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    } catch (error) {
      throw handleError(error, 'catalogService.getStickers');
    }
  },

  async saveCacheLocally(cache: CatalogCache): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATALOG_CACHE, JSON.stringify(cache));
      await AsyncStorage.setItem(STORAGE_KEYS.CATALOG_VERSION, String(cache.album.versao));
    } catch (error) {
      throw handleError(error, 'catalogService.saveCacheLocally');
    }
  },

  async loadCacheLocally(): Promise<CatalogCache | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATALOG_CACHE);
      return raw ? (JSON.parse(raw) as CatalogCache) : null;
    } catch (error) {
      logger.warn('Failed to load local catalog cache:', error);
      return null;
    }
  },

  async getLocalVersion(): Promise<number | null> {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.CATALOG_VERSION);
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  },

  async fetchAndCacheFullCatalog(): Promise<CatalogCache> {
    const album = await this.getAlbum();
    const [selecoes, figurinhas] = await Promise.all([
      this.getTeams(album.id),
      this.getStickers(album.id),
    ]);
    const cache: CatalogCache = { album, selecoes, figurinhas };
    await this.saveCacheLocally(cache);
    logger.log(`Catalog cached — version ${album.versao}`);
    return cache;
  },
};
