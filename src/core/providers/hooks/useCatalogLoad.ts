import { useEffect, useState, useRef } from 'react';
import { catalogService } from '@modules/album/services/catalogService';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { logger } from '@shared/utils/logger';

export function useCatalogLoad(bootstrapComplete: boolean): {
  catalogReady: boolean;
  error: string | null;
} {
  const [catalogReady, setCatalogReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!bootstrapComplete || initialized.current) return;
    initialized.current = true;

    let cancelled = false;

    const run = async () => {
      const store = useStickerStore.getState();
      store.setLoading(true);

      try {
        const localCache = await catalogService.loadCacheLocally();
        if (localCache) {
          store.setAlbum(localCache.album);
          store.setSelecoes(localCache.selecoes);
          store.setFigurinhas(localCache.figurinhas);
          store.setLoading(false);
          store.setInitialized(true);
          checkForCatalogUpdates(localCache.album.versao);
        } else {
          const cache = await catalogService.fetchAndCacheFullCatalog();
          store.setAlbum(cache.album);
          store.setSelecoes(cache.selecoes);
          store.setFigurinhas(cache.figurinhas);
          store.setLoading(false);
          store.setInitialized(true);
        }
      } catch (err) {
        logger.error('Failed to initialize catalog:', err);
        store.setLoading(false);
        if (!cancelled) setError('Falha ao carregar o catálogo. Verifique sua conexão.');
      }

      if (cancelled) return;

      await store.loadCollection();
      const currentStore = useStickerStore.getState();
      const allTypes = Array.from(
        new Set(currentStore.figurinhas.map(f => f.type).filter(Boolean)),
      );
      const currentUserSettings = useUserSettingsStore.getState();
      await currentUserSettings.loadSettings(allTypes);

      if (!cancelled) setCatalogReady(true);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [bootstrapComplete]);

  return { catalogReady, error };
}

async function checkForCatalogUpdates(currentVersion: number) {
  try {
    const remoteVersion = await catalogService.checkVersion();
    if (remoteVersion !== null && remoteVersion > currentVersion) {
      logger.log(`New catalog version: ${remoteVersion}. Updating...`);
      const cache = await catalogService.fetchAndCacheFullCatalog();
      const store = useStickerStore.getState();
      store.setAlbum(cache.album);
      store.setSelecoes(cache.selecoes);
      store.setFigurinhas(cache.figurinhas);
    }
  } catch (err) {
    logger.warn('Failed to check for catalog updates:', err);
  }
}
