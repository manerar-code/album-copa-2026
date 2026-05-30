import { create } from 'zustand';
import { collectionService } from '@shared/services/collectionService';
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

  // Actions
  setAlbum: (album: Album) => void;
  setSelecoes: (selecoes: Selecao[]) => void;
  setFigurinhas: (figurinhas: Figurinha[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  loadCollection: () => Promise<void>;
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

  setAlbum: album => set({ album }),
  setSelecoes: selecoes => set({ selecoes }),
  setFigurinhas: figurinhas => set({ figurinhas }),
  setLoading: isLoading => set({ isLoading }),
  setInitialized: isInitialized => set({ isInitialized }),

  loadCollection: async () => {
    try {
      const collection = await collectionService.load();
      set({ collection });
      logger.log('Collection loaded from storage');
    } catch (error) {
      logger.error('Failed to load collection:', error);
    }
  },

  toggleSticker: async (figurinhaId: string) => {
    const { collection } = get();
    const current = collection[figurinhaId] ?? 'missing';
    const next = STATUS_CYCLE[current];
    const updated = { ...collection, [figurinhaId]: next };
    set({ collection: updated });
    try {
      await collectionService.save(updated);
    } catch (error) {
      logger.error('Failed to persist collection:', error);
      // Rollback
      set({ collection });
    }
  },

  setStatus: async (figurinhaId: string, status: StickerStatus) => {
    const { collection } = get();
    const updated = { ...collection, [figurinhaId]: status };
    set({ collection: updated });
    try {
      await collectionService.save(updated);
    } catch (error) {
      logger.error('Failed to persist collection:', error);
      set({ collection });
    }
  },

  resetCollection: async () => {
    set({ collection: {} });
    await collectionService.reset();
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
