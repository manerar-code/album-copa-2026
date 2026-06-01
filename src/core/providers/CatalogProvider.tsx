import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogService } from '@modules/album/services/catalogService';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authService } from '@modules/auth/services/authService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { userAlbumService } from '@shared/services/userAlbumService';
import { supabase } from '@shared/services/supabase';
import { Loading } from '@shared/components/Loading';
import { SyncStatusBar } from '@shared/components/SyncStatusBar';
import { MergeDialog } from '@modules/auth/components/MergeDialog';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { syncService } from '@shared/services/syncService';
import { logger } from '@shared/utils/logger';
import { STORAGE_KEYS } from '@shared/storage/keys';
import { OnboardingContext } from './OnboardingContext';
import { colors, spacing, typography } from '@core/theme';
import type { MergeChoice } from '@modules/auth/components/MergeDialog';
import type { UserCollection } from '@shared/types';

interface MergeState {
  visible: boolean;
  localCollection: UserCollection;
  cloudCollection: UserCollection;
  userAlbumId: string;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [mergeState, setMergeState] = useState<MergeState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const store = useStickerStore();
  const authStore = useAuthStore();
  const userSettings = useUserSettingsStore();
  const bootstrapSyncedUserId = useRef<string | null>(null);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    } catch {}
    setShowOnboarding(false);
  }, []);

  const restartTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, '');
    } catch {}
    setShowOnboarding(true);
  }, []);

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
    async (userId: string, userName: string, isNewLogin = false) => {
      store.setSyncUserId(userId);

      // Carrega ou cria user_albums
      let albums = await userAlbumService.list(userId).catch(() => []);
      if (albums.length === 0) {
        const created = await userAlbumService.create(userId, `Álbum do ${userName.split(' ')[0]}`);
        albums = [created];
      }
      store.setUserAlbums(albums);

      const activeAlbum = albums[0];
      store.setActiveUserAlbum(activeAlbum.id);

      // Carrega todas as coleções em paralelo
      const allEntries = await Promise.all(
        albums.map(async a => {
          const col = await cloudCollectionService.load(a.id).catch(() => ({}));
          return [a.id, col] as [string, UserCollection];
        }),
      );
      const allCollections = Object.fromEntries(allEntries);
      store.setAllCollections(allCollections);

      const cloudCollection = allCollections[activeAlbum.id] ?? {};
      const localCollection = store.collection;
      const localCount = Object.values(localCollection).filter(s => s !== 'missing').length;
      const cloudCount = Object.values(cloudCollection).filter(s => s !== 'missing').length;

      if (!isNewLogin) {
        if (cloudCount > 0) await store.applyCollection(cloudCollection);
        return;
      }

      // Novo login: resolve conflito
      if (localCount > 0 && cloudCount > 0) {
        setMergeState({ visible: true, localCollection, cloudCollection, userAlbumId: activeAlbum.id });
      } else if (cloudCount > 0) {
        await store.applyCollection(cloudCollection);
      } else if (localCount > 0) {
        await cloudCollectionService.replaceAll(activeAlbum.id, localCollection, userId);
        logger.log('Local collection migrated to cloud');
      }
    },
    [store],
  );

  const handleMergeChoice = useCallback(
    async (choice: MergeChoice) => {
      if (!mergeState) return;
      const { localCollection, cloudCollection, userAlbumId } = mergeState;
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
      if (store.syncUserId) {
        await cloudCollectionService.replaceAll(userAlbumId, final, store.syncUserId);
      }
    },
    [mergeState, store],
  );

  // ─── Bootstrap ───────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      authStore.setLoading(true);

      // Lê flag de onboarding em paralelo (não bloqueia o bootstrap)
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE).then(val => {
        if (val !== 'true') setShowOnboarding(true);
      });

      // Inicializa fila offline antes de carregar coleção local
      await offlineQueueService.init().catch(() => {});

      const user = await authService.getCurrentUser();
      if (user) authStore.setUser(user);
      authStore.setLoading(false);

      await initializeCatalog();
      await store.loadCollection();

      // Carrega configurações de tipos do usuário
      const allTypes = Array.from(new Set(store.figurinhas.map(f => f.type).filter(Boolean)));
      await userSettings.loadSettings(allTypes);

      if (user) {
        bootstrapSyncedUserId.current = user.id;
        await handleUserLogin(user.id, user.name);
        syncService.start(user.id);
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
        const isNewLogin = bootstrapSyncedUserId.current !== user.id;
        bootstrapSyncedUserId.current = null;
        await handleUserLogin(user.id, user.name, isNewLogin);
      } else if (event === 'SIGNED_OUT') {
        syncService.stop();
        await offlineQueueService.clear();
        authStore.setUser(null);
        store.setSyncUserId(null);
        store.setUserAlbums([]);
        store.setActiveUserAlbum('');
        store.setAllCollections({});
        await store.applyCollection({});
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

  if (authStore.isLoading) {
    return <Loading />;
  }

  return (
    <OnboardingContext.Provider value={{ showOnboarding, completeOnboarding, restartTutorial }}>
      <SyncStatusBar />
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
    </OnboardingContext.Provider>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },
});
