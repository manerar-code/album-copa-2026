import NetInfo from '@react-native-community/netinfo';
import { offlineQueueService } from './offlineQueueService';
import { useSyncStore } from '@shared/store/syncStore';
import { logger } from '@shared/utils/logger';

interface SyncService {
  start(userId: string): void;
  stop(): void;
}

function createSyncService(): SyncService {
  let unsubscribe: (() => void) | null = null;
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let currentUserId: string | null = null;

  async function tryFlush(): Promise<void> {
    if (!currentUserId) return;
    const store = useSyncStore.getState();
    store.setStatus('syncing');

    try {
      const result = await offlineQueueService.flush(currentUserId);
      const pendingCount = await offlineQueueService.count();

      store.setPendingCount(pendingCount);
      store.setStatus(pendingCount === 0 ? 'synced' : 'pending');

      if (result.synced > 0) {
        logger.log('queue:flush:done', {
          synced: result.synced,
          failed: result.failed,
        });
      }
    } catch (error) {
      useSyncStore.getState().setStatus('pending');
      logger.warn('sync:flush:error', error);
    }
  }

  function startPollingFallback(): void {
    if (pollingInterval) return;
    pollingInterval = setInterval(tryFlush, 30_000);
    logger.warn('sync:polling:started — NetInfo listener unavailable');
  }

  function stopPolling(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  return {
    start(userId: string): void {
      if (unsubscribe) {
        logger.warn('syncService.start called twice — ignoring');
        return;
      }

      currentUserId = userId;

      try {
        const sub = NetInfo.addEventListener(state => {
          if (!currentUserId) return;

          if (state.isConnected) {
            useSyncStore.getState().setStatus('syncing');
            tryFlush();
          } else {
            useSyncStore.getState().setStatus('offline');
          }
        });
        unsubscribe = () => sub.remove();

        NetInfo.fetch()
          .then(state => {
            if (!currentUserId) return;
            if (state.isConnected) {
              tryFlush();
            } else {
              useSyncStore.getState().setStatus('offline');
            }
          })
          .catch(() => {});
      } catch (error) {
        logger.warn('syncService:NetInfo listener failed — falling back to polling', error);
        startPollingFallback();
      }
    },

    stop(): void {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      stopPolling();
      currentUserId = null;
    },
  };
}

export const syncService: SyncService = createSyncService();
