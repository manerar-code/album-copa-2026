import { create } from 'zustand';
import { collectionService } from '@shared/services/collectionService';
import { quantitiesService } from '@shared/services/quantitiesService';
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
  quantities: Record<string, number>;
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
  incrementDupCount: (figurinhaId: string) => Promise<void>;
  resetSticker: (figurinhaId: string) => Promise<void>;
  getDupCount: (figurinhaId: string) => number;
  registerTrade: (sent: string[], received: string[]) => Promise<void>;

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
  quantities: {},
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
      const [collection, quantities] = await Promise.all([
        collectionService.load(userAlbumId),
        quantitiesService.load(userAlbumId),
      ]);
      set({ collection, quantities });
      logger.log('Collection and quantities loaded from storage');
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
    const current = collection[figurinhaId] ?? 'missing';

    // When already duplicate, increment count instead of cycling to missing (ADR-001)
    if (current === 'duplicate') {
      get().incrementDupCount(figurinhaId);
      return;
    }

    const previousCollection = collection;
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

  incrementDupCount: async (figurinhaId: string) => {
    const { quantities, activeUserAlbumId } = get();
    const current = quantities[figurinhaId] ?? 1;
    const updated = { ...quantities, [figurinhaId]: current + 1 };
    set({ quantities: updated });

    try {
      if (activeUserAlbumId) await quantitiesService.save(updated, activeUserAlbumId);
    } catch (error) {
      logger.error('incrementDupCount: local save failed — reverting', error);
      set({ quantities });
    }
  },

  resetSticker: async (figurinhaId: string) => {
    const { collection, quantities, activeUserAlbumId, allCollections, syncUserId } = get();
    const previousCollection = collection;
    const previousQuantities = quantities;

    const updated = { ...collection, [figurinhaId]: 'missing' } as UserCollection;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [figurinhaId]: _, ...updatedQuantities } = quantities;

    set({
      collection: updated,
      quantities: updatedQuantities as Record<string, number>,
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: updated }
        : allCollections,
    });

    try {
      if (activeUserAlbumId) {
        await Promise.all([
          collectionService.save(updated, activeUserAlbumId),
          quantitiesService.save(updatedQuantities as Record<string, number>, activeUserAlbumId),
        ]);
      }
    } catch (error) {
      logger.error('resetSticker: local save failed — reverting', error);
      set({ collection: previousCollection, quantities: previousQuantities });
      return;
    }

    // Sincroniza remoção com a nuvem — sem isso, ao retornar ao app o merge
    // cloud reverte 'missing' para 'duplicate' pois duplicate tem prioridade maior.
    if (activeUserAlbumId && syncUserId) {
      try {
        await cloudCollectionService.upsertOne(
          activeUserAlbumId,
          figurinhaId,
          'missing',
          syncUserId,
        );
      } catch (syncError) {
        logger.warn('resetSticker: cloud sync failed (will retry on reload)', syncError);
      }
    }
  },

  getDupCount: (figurinhaId: string): number => {
    return get().quantities[figurinhaId] ?? 1;
  },

  registerTrade: async (sent: string[], received: string[]) => {
    const { collection, quantities, activeUserAlbumId, allCollections, syncUserId } = get();
    const previousCollection = collection;
    const previousQuantities = quantities;

    const newCollection: UserCollection = { ...collection };
    const newQuantities: Record<string, number> = { ...quantities };
    const changed: Array<{ figurinhaId: string; status: StickerStatus }> = [];

    for (const figurinhaId of sent) {
      const currentStatus = newCollection[figurinhaId] ?? 'missing';
      if (currentStatus === 'missing') continue;

      if (currentStatus === 'duplicate') {
        const qty = newQuantities[figurinhaId] ?? 1;
        const remaining = qty - 1;
        if (remaining >= 2) {
          newQuantities[figurinhaId] = remaining;
          changed.push({ figurinhaId, status: 'duplicate' });
        } else {
          newCollection[figurinhaId] = 'owned';
          delete newQuantities[figurinhaId];
          changed.push({ figurinhaId, status: 'owned' });
        }
      } else if (currentStatus === 'owned') {
        newCollection[figurinhaId] = 'missing';
        delete newQuantities[figurinhaId];
        changed.push({ figurinhaId, status: 'missing' });
      }
    }

    for (const figurinhaId of received) {
      if ((newCollection[figurinhaId] ?? 'missing') === 'owned') continue;
      newCollection[figurinhaId] = 'owned';
      delete newQuantities[figurinhaId];
      changed.push({ figurinhaId, status: 'owned' });
    }

    set({
      collection: newCollection,
      quantities: newQuantities,
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: newCollection }
        : allCollections,
    });

    try {
      if (activeUserAlbumId) {
        await Promise.all([
          collectionService.save(newCollection, activeUserAlbumId),
          quantitiesService.save(newQuantities, activeUserAlbumId),
        ]);
      }
    } catch (error) {
      logger.error('registerTrade: local save failed — reverting', error);
      set({
        collection: previousCollection,
        quantities: previousQuantities,
        allCollections: activeUserAlbumId
          ? { ...allCollections, [activeUserAlbumId]: previousCollection }
          : allCollections,
      });
      return;
    }

    logger.log(`registerTrade: completed — ${sent.length} sent, ${received.length} received`);

    const albumId = activeUserAlbumId;
    const userId = syncUserId;
    if (albumId && userId && changed.length > 0) {
      if (useSyncStore.getState().status !== 'offline') {
        try {
          await Promise.all(
            changed.map(({ figurinhaId, status }) =>
              cloudCollectionService.upsertOne(albumId, figurinhaId, status, userId),
            ),
          );
        } catch (syncError) {
          logger.warn('registerTrade: cloud sync failed (will retry on reload)', syncError);
        }
      }
    }
  },

  resetCollection: async () => {
    const { collection, quantities, activeUserAlbumId, allCollections, syncUserId } = get();
    // Snapshot for rollback
    const previousCollection = collection;
    const previousQuantities = quantities;
    const previousAllCollections = allCollections;
    set({
      collection: {},
      quantities: {},
      allCollections: activeUserAlbumId
        ? { ...allCollections, [activeUserAlbumId]: {} }
        : allCollections,
    });
    try {
      if (activeUserAlbumId) {
        await Promise.all([
          collectionService.reset(activeUserAlbumId),
          quantitiesService.reset(activeUserAlbumId),
        ]);
      }
      if (activeUserAlbumId && syncUserId) {
        await cloudCollectionService.replaceAll(activeUserAlbumId, {}, syncUserId);
      }
    } catch (error) {
      logger.error('Failed to reset collection:', error);
      set({
        collection: previousCollection,
        quantities: previousQuantities,
        allCollections: previousAllCollections,
      });
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
    const possessed = owned + duplicate;
    return { total, owned: possessed, duplicate, missing: total - possessed };
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
