import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { catalogService } from '@modules/album/services/catalogService';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { Loading } from '@shared/components/Loading';
import { logger } from '@shared/utils/logger';
import { colors, spacing, typography } from '@core/theme';

interface CatalogProviderProps {
  children: React.ReactNode;
}

export function CatalogProvider({ children }: CatalogProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const store = useStickerStore();

  const checkForUpdates = useCallback(
    async (currentVersion: number) => {
      try {
        const remoteVersion = await catalogService.checkVersion();
        if (remoteVersion !== null && remoteVersion > currentVersion) {
          logger.log(`New catalog version: ${remoteVersion}. Updating...`);
          const cache = await catalogService.fetchAndCacheFullCatalog();
          store.setAlbum(cache.album);
          store.setSelecoes(cache.selecoes);
          store.setFigurinhas(cache.figurinhas);
        }
      } catch (err) {
        logger.warn('Failed to check for catalog updates:', err);
      }
    },
    [store],
  );

  const initializeCatalog = useCallback(async () => {
    store.setLoading(true);
    try {
      const localCache = await catalogService.loadCacheLocally();
      if (localCache) {
        store.setAlbum(localCache.album);
        store.setSelecoes(localCache.selecoes);
        store.setFigurinhas(localCache.figurinhas);
        await store.loadCollection();
        store.setLoading(false);
        store.setInitialized(true);
        checkForUpdates(localCache.album.versao);
      } else {
        const cache = await catalogService.fetchAndCacheFullCatalog();
        store.setAlbum(cache.album);
        store.setSelecoes(cache.selecoes);
        store.setFigurinhas(cache.figurinhas);
        await store.loadCollection();
        store.setLoading(false);
        store.setInitialized(true);
      }
    } catch (err) {
      logger.error('Failed to initialize catalog:', err);
      store.setLoading(false);
      setError('Falha ao carregar o catálogo. Verifique sua conexão.');
    }
  }, [store, checkForUpdates]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void initializeCatalog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!store.isInitialized) {
    return <Loading />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },
});
