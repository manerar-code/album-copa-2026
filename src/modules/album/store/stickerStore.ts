import { create } from 'zustand';
import { collectionService } from '@shared/services/collectionService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { logger } from '@shared/utils/logger';
import type { StickerStatus, UserCollection, Selecao, Figurinha, Album } from '@shared/types';

const STATUS_CYCLE: Record<StickerStatus, StickerStatus> = {
  missing: 'owned',
  owned: 'duplicate',
  duplicate: 'missing',
};

interface CatalogState {
  album: Album | null;
  selecoes: Selecao[];
  figurinhas: Figurinha[];
  collection: UserCollection;
  isLoading: boolean;
  isInitialized: boolean;
  // userId para sync na nuvem (null = modo offline)
  syncUserId: string | null;

  // Actions
  setAlbum: (album: Album) => void;
  setSelecoes: (selecoes: Selecao[]) => void;
  setFigurinhas: (figurinhas: Figurinha[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setSyncUserId: (userId: string | null) => void;
  loadCollection: () => Promise<void>;
  loadCloudCollection: (userId: string) => Promise<UserCollection>;
  applyCollection: (collection: UserCollection) => Promise<void>;
  toggleSticker: (figurinhaId: string) => Promise<void>;
  setStatus: (figurinhaId: string, status: StickerStatus) => Promise<void>;
  resetCollection: () => Promise<void>;

  // Computed helpers
  getStatus: (figurinhaId: string) => StickerStatus;
  getStats: () => { total: number; owned: number; missing: number; duplicate: number };
}

export const useStickerStore = create<CatalogState>((set, get) => ({
  album: null,
  selecoes: [],
  figurinhas: [],
  collection: {},
  isLoading: false,
  isInitialized: false,
  syncUserId: null,

  setAlbum: album => set({ album }),
  setSelecoes: selecoes => set({ selecoes }),
  setFigurinhas: figurinhas => set({ figurinhas }),
  setLoading: isLoading => set({ isLoading }),
  setInitialized: isInitialized => set({ isInitialized }),
  setSyncUserId: syncUserId => set({ syncUserId }),

  loadCollection: async () => {
    try {
      const collection = await collectionService.load();
      set({ collection });
      logger.log('Collection loaded from storage');
    } catch (error) {
      logger.error('Failed to load collection:', error);
    }
  },

  loadCloudCollection: async (userId: string) => {
    return await cloudCollectionService.load(userId);
  },

  applyCollection: async (collection: UserCollection) => {
    set({ collection });
    await collectionService.save(collection);
  },

  toggleSticker: async (figurinhaId: string) => {
    const { collection, syncUserId } = get();
    const current = collection[figurinhaId] ?? 'missing';
    const next = STATUS_CYCLE[current];
    const updated = { ...collection, [figurinhaId]: next };
    set({ collection: updated });
    try {
      await collectionService.save(updated);
      if (syncUserId) {
        await cloudCollectionService.upsertOne(syncUserId, figurinhaId, next);
      }
    } catch (error) {
      logger.error('Failed to persist collection:', error);
      set({ collection }); // rollback
    }
  },

  setStatus: async (figurinhaId: string, status: StickerStatus) => {
    const { collection, syncUserId } = get();
    const updated = { ...collection, [figurinhaId]: status };
    set({ collection: updated });
    try {
      await collectionService.save(updated);
      if (syncUserId) {
        await cloudCollectionService.upsertOne(syncUserId, figurinhaId, status);
      }
    } catch (error) {
      logger.error('Failed to persist collection:', error);
      set({ collection }); // rollback
    }
  },

  resetCollection: async () => {
    const { syncUserId } = get();
    set({ collection: {} });
    await collectionService.reset();
    if (syncUserId) {
      await cloudCollectionService.replaceAll(syncUserId, {});
    }
  },

  getStatus: (figurinhaId: string): StickerStatus => {
    return get().collection[figurinhaId] ?? 'missing';
  },

  getStats: () => {
    const { figurinhas, collection } = get();
    const total = figurinhas.length;
    let owned = 0;
    let duplicate = 0;
    for (const figurinha of figurinhas) {
      const status = collection[figurinha.id] ?? 'missing';
      if (status === 'owned') owned++;
      else if (status === 'duplicate') duplicate++;
    }
    return { total, owned, duplicate, missing: total - owned - duplicate };
  },
}));
