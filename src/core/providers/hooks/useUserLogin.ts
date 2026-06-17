import { useState, useCallback } from 'react';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { userAlbumService } from '@shared/services/userAlbumService';
import { accountDeletionService } from '@modules/auth/services/accountDeletionService';
import { authService } from '@modules/auth/services/authService';
import { logger } from '@shared/utils/logger';
import type { MergeChoice } from '@modules/auth/components/MergeDialog';
import type { UserCollection } from '@shared/types';

interface MergeState {
  visible: boolean;
  localCollection: UserCollection;
  cloudCollection: UserCollection;
  userAlbumId: string;
}

export function useUserLogin() {
  const [mergeState, setMergeState] = useState<MergeState | null>(null);

  const handleUserLogin = useCallback(
    async (userId: string, userName: string, isNewLogin = false) => {
      const store = useStickerStore.getState();
      const authStore = useAuthStore.getState();
      store.setSyncUserId(userId);

      let albums = await userAlbumService.list(userId).catch(() => []);
      if (albums.length === 0) {
        const created = await userAlbumService.create(userId, `Álbum do ${userName.split(' ')[0]}`);
        albums = [created];
      }
      store.setUserAlbums(albums);

      const activeAlbum = albums[0];
      store.setActiveUserAlbum(activeAlbum.id);
      await store.loadCollection(activeAlbum.id);

      // Carrega configuracoes de tipo escopadas por usuario
      const allTypes = Array.from(
        new Set(
          useStickerStore
            .getState()
            .figurinhas.map(f => f.type)
            .filter(Boolean),
        ),
      ) as string[];
      await useUserSettingsStore.getState().loadSettings(allTypes, activeAlbum.id);

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
        if (cloudCount > 0 || localCount > 0) {
          // Local-wins merge: cloud fills gaps only; local always wins conflicts.
          // Prevents stale cloud 'duplicate' from overwriting local 'owned' on every refresh.
          const merged: UserCollection = {};
          for (const [id, status] of Object.entries(cloudCollection)) {
            if (status !== 'missing') merged[id] = status;
          }
          for (const [id, status] of Object.entries(localCollection)) {
            if (status !== 'missing') merged[id] = status;
            else delete merged[id];
          }
          await store.applyCollection(merged);
          const mergedCount = Object.values(merged).filter(s => s !== 'missing').length;
          if (mergedCount > cloudCount) {
            await cloudCollectionService
              .replaceAll(activeAlbum.id, merged, userId)
              .catch(e => logger.warn('handleUserLogin: re-sync after merge failed', e));
          }
        }
      } else {
        if (localCount > 0 && cloudCount > 0) {
          setMergeState({
            visible: true,
            localCollection,
            cloudCollection,
            userAlbumId: activeAlbum.id,
          });
        } else if (cloudCount > 0) {
          await store.applyCollection(cloudCollection);
        } else if (localCount > 0) {
          await cloudCollectionService.replaceAll(activeAlbum.id, localCollection, userId);
          logger.log('Local collection migrated to cloud');
        }
      }

      try {
        const pending = await accountDeletionService.getPendingRequest(userId);
        if (
          pending &&
          pending.scheduledDeleteAt < new Date().toISOString() &&
          !pending.completedAt
        ) {
          await authService.signOut();
          authStore.setPendingDeletion(null);
          return;
        }
        authStore.setPendingDeletion(pending);
      } catch (e) {
        logger.warn('handleUserLogin: pending deletion check failed', e);
        authStore.setPendingDeletion(null);
      }
    },
    [],
  );

  const handleMergeChoice = useCallback(
    async (choice: MergeChoice) => {
      const store = useStickerStore.getState();
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
    [mergeState],
  );

  return { handleUserLogin, mergeState, handleMergeChoice };
}
