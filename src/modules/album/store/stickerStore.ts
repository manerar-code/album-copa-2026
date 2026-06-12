import { create } from 'zustand';
import { collectionService } from '@shared/services/collectionService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { useSyncStore } from '@shared/store/syncStore';
import { logger } from '@shared/utils/logger';
import type {
  StickerStatus,
  UserCollection,
  Selecao,
  Figurinha,
  Album,
  UserAlbum,
} from '@shared/types';

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
  // Todas as coleções do usuário (para indicador de troca entre álbuns)
  allCollections: Record<string, UserCollection>; // userAlbumId → collection
  userAlbums: UserAlbum[];
  activeUserAlbumId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  syncUserId: string | null;

  // Actions
  setAlbum: (album: Album) => void;
  setSelecoes: (selecoes: Selecao[]) => void;
  setFigurinhas: (figurinhas: Figurinha[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setSyncUserId: (userId: string | null) => void;
  setUserAlbums: (albums: UserAlbum[]) => void;
  setActiveUserAlbum: (userAlbumId: string | null) => void;
  setAllCollections: (all: Record<string, UserCollection>) => void;
  loadCollection: (userAlbumId: string) => Promise<void>;
  loadCloudCollection: (userAlbumId: string) => Promise<UserCollection>;
  applyCollection: (collection: UserCollection) => Promise<void>;
  toggleSticker: (figurinhaId: string) => Promise<void>;
  setStatus: (figurinhaId: string, status: StickerStatus, targetAlbumId?: string) => Promise<void>;
  resetCollection: () => Promise<void>;

  // Computed helpers
  getStatus: (figurinhaId: string) => StickerStatus;
  getStats: () => { total: number; owned: number; missing: number; duplicate: number };
  // Retorna o userAlbumId de outra coleção que tem esta figurinha como 'duplicate'
  // enquanto na coleção ativa ela está 'missing'
  getTradeSource: (figurinhaId: string) => string | null;
  // Retorna os IDs dos álbuns (excluindo o ativo) onde a figurinha está como 'duplicate'
  getCrossAlbumDuplicateSources: (figurinhaId: string) => string[];
}

export const useStickerStore = create<CatalogState>((set, get) => ({
  album: null,
  selecoes: [],
  figurinhas: [],
  collection: {},
  allCollections: {},
  userAlbums: [],
  activeUserAlbumId: null,
  isLoading: false,
  isInitialized: false,
  syncUserId: null,

  setAlbum: album => set({ album }),
  setSelecoes: selecoes => set({ selecoes }),
  setFigurinhas: figurinhas => set({ figurinhas }),
  setLoading: isLoading => set({ isLoading }),
  setInitialized: isInitialized => set({ isInitialized }),
  setSyncUserId: syncUserId => set({ syncUserId }),
  setUserAlbums: userAlbums => set({ userAlbums }),
  setActiveUserAlbum: activeUserAlbumId => set({ activeUserAlbumId }),
  setAllCollections: allCollections => set({ allCollections }),

  loadCollection: async (userAlbumId: string) => {
    try {
      const collection = await collectionService.load(userAlbumId);
      set({ collection });
      logger.log('Collection loaded from storage');
    } catch (error) {
      logger.error('Failed to load collection:', error);
    }
  },

  loadCloudCollection: async (userAlbumId: string) => {
    return await cloudCollectionService.load(userAlbumId);
  },

  applyCollection: async (collection: UserCollection) => {
    const { activeUserAlbumId, allCollections } = get();
    set({
      collection,
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: collection }
        : allCollections,
    });
    if (activeUserAlbumId) {
      await collectionService.save(collection, activeUserAlbumId);
    }
  },

  toggleSticker: async (figurinhaId: string) => {
    const { collection, activeUserAlbumId, allCollections, syncUserId } = get();
    const previousCollection = collection;
    const current = collection[figurinhaId] ?? 'missing';
    const next = STATUS_CYCLE[current];
    const updated = { ...collection, [figurinhaId]: next };
    set({
      collection: updated,
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: updated }
        : allCollections,
    });

    // 1. Salva localmente (AsyncStorage/localStorage). Só reverte se isto falhar.
    try {
      if (activeUserAlbumId) await collectionService.save(updated, activeUserAlbumId);
    } catch (saveError) {
      logger.error('toggleSticker: local save failed — reverting', saveError);
      set({ collection: previousCollection });
      return;
    }

    // 2. Sincroniza com a nuvem — em background, sem reverter o estado local em caso de falha.
    //    Dados estão seguros no AsyncStorage; a próxima inicialização fará o re-sync.
    if (activeUserAlbumId && syncUserId) {
      try {
        if (useSyncStore.getState().status === 'offline') {
          if (next !== 'missing') {
            await offlineQueueService.enqueue({
              userAlbumId: activeUserAlbumId,
              figurinhaId,
              status: next,
              createdAt: Date.now(),
            });
          }
        } else {
          await cloudCollectionService.upsertOne(activeUserAlbumId, figurinhaId, next, syncUserId);
        }
      } catch (syncError) {
        // Falha de rede: dados estão no AsyncStorage e serão re-sincronizados ao reabrir o app.
        logger.warn('toggleSticker: cloud sync failed (will retry on reload)', syncError);
      }
    }
  },

  setStatus: async (figurinhaId: string, status: StickerStatus, targetAlbumId?: string) => {
    const { collection, activeUserAlbumId, allCollections, syncUserId } = get();

    if (targetAlbumId !== undefined && targetAlbumId !== activeUserAlbumId) {
      const prevCollections = allCollections;
      const targetCollection = allCollections[targetAlbumId] ?? {};
      const updatedTarget = { ...targetCollection, [figurinhaId]: status };
      set({
        allCollections: { ...allCollections, [targetAlbumId]: updatedTarget },
      });
      try {
        if (syncUserId) {
          await cloudCollectionService.upsertOne(targetAlbumId, figurinhaId, status, syncUserId);
        }
      } catch (error) {
        logger.error('Failed to persist target album:', error);
        set({ allCollections: prevCollections });
      }
    } else {
      const updated = { ...collection, [figurinhaId]: status };
      set({
        collection: updated,
        allCollections: activeUserAlbumId
          ? { ...allCollections, [activeUserAlbumId]: updated }
          : allCollections,
      });
      try {
        if (activeUserAlbumId) await collectionService.save(updated, activeUserAlbumId);
        if (activeUserAlbumId && syncUserId) {
          await cloudCollectionService.upsertOne(
            activeUserAlbumId,
            figurinhaId,
            status,
            syncUserId,
          );
        }
      } catch (error) {
        logger.error('Failed to persist collection:', error);
        set({ collection });
      }
    }
  },

  resetCollection: async () => {
    const { collection, activeUserAlbumId, allCollections, syncUserId } = get();
    // Snapshot for rollback
    const previousCollection = collection;
    const previousAllCollections = allCollections;
    set({
      collection: {},
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: {} }
        : allCollections,
    });
    try {
      if (activeUserAlbumId) await collectionService.reset(activeUserAlbumId);
      if (activeUserAlbumId && syncUserId) {
        await cloudCollectionService.replaceAll(activeUserAlbumId, {}, syncUserId);
      }
    } catch (error) {
      logger.error('Failed to reset collection:', error);
      set({ collection: previousCollection, allCollections: previousAllCollections });
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

  getTradeSource: (figurinhaId: string): string | null => {
    const { collection, allCollections, activeUserAlbumId, userAlbums } = get();
    const activeStatus = collection[figurinhaId] ?? 'missing';
    if (activeStatus !== 'missing') return null;
    for (const [albumId, col] of Object.entries(allCollections)) {
      if (albumId === activeUserAlbumId) continue;
      if ((col[figurinhaId] ?? 'missing') === 'duplicate') {
        const album = userAlbums.find(a => a.id === albumId);
        return album?.name ?? albumId;
      }
    }
    return null;
  },

  getCrossAlbumDuplicateSources: (figurinhaId: string): string[] => {
    const { allCollections, activeUserAlbumId } = get();
    return Object.entries(allCollections)
      .filter(([albumId, col]) => albumId !== activeUserAlbumId && col[figurinhaId] === 'duplicate')
      .map(([albumId]) => albumId);
  },
}));
