import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { catalogService } from '@modules/album/services/catalogService';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authService } from '@modules/auth/services/authService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { supabase } from '@shared/services/supabase';
import { Loading } from '@shared/components/Loading';
import { MergeDialog } from '@modules/auth/components/MergeDialog';
import { logger } from '@shared/utils/logger';
import { colors, spacing, typography } from '@core/theme';
import type { MergeChoice } from '@modules/auth/components/MergeDialog';
import type { UserCollection } from '@shared/types';

interface MergeState {
  visible: boolean;
  localCollection: UserCollection;
  cloudCollection: UserCollection;
  userId: string;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [mergeState, setMergeState] = useState<MergeState | null>(null);
  const store = useStickerStore();
  const authStore = useAuthStore();

  // ─── Catálogo ────────────────────────────────────────────────────────────
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
        store.setLoading(false);
        store.setInitialized(true);
        checkForUpdates(localCache.album.versao);
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
      setError('Falha ao carregar o catálogo. Verifique sua conexão.');
    }
  }, [store, checkForUpdates]);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const handleUserLogin = useCallback(
    async (userId: string) => {
      store.setSyncUserId(userId);
      const local = await store.loadCloudCollection(userId).catch(() => null);
      const localCollection = store.collection;

      const cloudCollection = local ?? {};
      const localCount = Object.values(localCollection).filter(s => s !== 'missing').length;
      const cloudCount = Object.values(cloudCollection).filter(s => s !== 'missing').length;

      if (localCount > 0 && cloudCount > 0) {
        // Tem dados nos dois lados — pergunta ao usuário
        setMergeState({ visible: true, localCollection, cloudCollection, userId });
      } else if (cloudCount > 0) {
        // Só na nuvem — usa nuvem
        await store.applyCollection(cloudCollection);
      } else if (localCount > 0) {
        // Só local — migra para nuvem
        await cloudCollectionService.replaceAll(userId, localCollection);
        logger.log('Local collection migrated to cloud');
      }
      // Se ambos vazios, não faz nada
    },
    [store],
  );

  const handleMergeChoice = useCallback(
    async (choice: MergeChoice) => {
      if (!mergeState) return;
      const { localCollection, cloudCollection, userId } = mergeState;
      setMergeState(null);

      let final: UserCollection;
      if (choice === 'merge') {
        final = cloudCollectionService.merge(localCollection, cloudCollection);
      } else if (choice === 'local') {
        final = localCollection;
      } else {
        final = cloudCollection;
      }

      await store.applyCollection(final);
      await cloudCollectionService.replaceAll(userId, final);
    },
    [mergeState, store],
  );

  // ─── Bootstrap ───────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      authStore.setLoading(true);

      // Verifica sessão salva
      const user = await authService.getCurrentUser();
      if (user) {
        authStore.setUser(user);
      }
      authStore.setLoading(false);

      // Carrega catálogo e coleção local
      await initializeCatalog();
      await store.loadCollection();

      // Se logado, sincroniza com nuvem
      if (user) {
        await handleUserLogin(user.id);
      }
    };

    void bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Escuta mudanças de auth (login/logout em tempo real)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const u = session.user;
        const user = {
          id: u.id,
          email: u.email ?? '',
          name: u.user_metadata?.full_name ?? u.email ?? 'Usuário',
          avatar_url: u.user_metadata?.avatar_url,
        };
        authStore.setUser(user);
        await handleUserLogin(user.id);
      } else if (event === 'SIGNED_OUT') {
        authStore.setUser(null);
        store.setSyncUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [authStore, store, handleUserLogin]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!store.isInitialized || authStore.isLoading) {
    return <Loading />;
  }

  return (
    <>
      {children}
      <MergeDialog
        visible={mergeState?.visible ?? false}
        localCount={
          Object.values(mergeState?.localCollection ?? {}).filter(s => s !== 'missing').length
        }
        cloudCount={
          Object.values(mergeState?.cloudCollection ?? {}).filter(s => s !== 'missing').length
        }
        onChoice={handleMergeChoice}
      />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },
});
