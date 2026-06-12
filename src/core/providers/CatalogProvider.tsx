import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { syncService } from '@shared/services/syncService';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { logger } from '@shared/utils/logger';
import { STORAGE_KEYS } from '@shared/storage/keys';
import { Loading } from '@shared/components/Loading';
import { SyncStatusBar } from '@shared/components/SyncStatusBar';
import { MergeDialog } from '@modules/auth/components/MergeDialog';
import { OnboardingContext } from './OnboardingContext';
import { useBootstrap } from './hooks/useBootstrap';
import { useCatalogLoad } from './hooks/useCatalogLoad';
import { useAuthListener } from './hooks/useAuthListener';
import { useUserLogin } from './hooks/useUserLogin';
import { colors, spacing, typography } from '@core/theme';

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const authStore = useAuthStore();
  const bootstrapSyncedUserId = useRef<string | null>(null);

  const { bootstrapComplete } = useBootstrap();
  const { catalogReady, error } = useCatalogLoad(bootstrapComplete);
  const { handleUserLogin, mergeState, handleMergeChoice } = useUserLogin();

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    } catch (e) {
      logger.warn('completeOnboarding: failed to persist', e);
    }
    setShowOnboarding(false);
  }, []);

  const restartTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, '');
    } catch (e) {
      logger.warn('restartTutorial: failed to persist', e);
    }
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE).then(val => {
      if (val !== 'true') setShowOnboarding(true);
    });
  }, []);

  useEffect(() => {
    if (catalogReady && authStore.user) {
      const user = authStore.user;
      bootstrapSyncedUserId.current = user.id;
      handleUserLogin(user.id, user.name);
      syncService.start(user.id);
    }
  }, [catalogReady, authStore.user, handleUserLogin]);

  const handleSignIn = useCallback(
    async (isNew: boolean) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await handleUserLogin(currentUser.id, currentUser.name, isNew);
      }
    },
    [handleUserLogin],
  );

  const handleSignOut = useCallback(() => {
    const s = useStickerStore.getState();
    s.applyCollection({});
    syncService.stop();
    offlineQueueService.clear();
    useAuthStore.getState().setUser(null);
    s.setSyncUserId(null);
    s.setUserAlbums([]);
    s.setActiveUserAlbum(null);
    s.setAllCollections({});
  }, []);

  useAuthListener(handleSignIn, handleSignOut, bootstrapSyncedUserId);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!bootstrapComplete) {
    return <Loading />;
  }

  return (
    <OnboardingContext.Provider value={{ showOnboarding, completeOnboarding, restartTutorial }}>
      <SyncStatusBar />
      {children}
      {mergeState && (
        <MergeDialog
          visible={mergeState.visible}
          localCount={Object.values(mergeState.localCollection).filter(s => s !== 'missing').length}
          cloudCount={Object.values(mergeState.cloudCollection).filter(s => s !== 'missing').length}
          onChoice={handleMergeChoice}
        />
      )}
    </OnboardingContext.Provider>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },
});
