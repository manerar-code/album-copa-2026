import { useEffect, useState } from 'react';
import { offlineQueueService } from '@shared/services/offlineQueueService';
import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/store/authStore';
import { logger } from '@shared/utils/logger';
import type { AppUser } from '@shared/types';

const BOOTSTRAP_TIMEOUT_MS = 8000;

export function useBootstrap(): { bootstrapComplete: boolean } {
  const authStore = useAuthStore();
  const [bootstrapComplete, setBootstrapComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      authStore.setLoading(true);

      let user: AppUser | null;
      try {
        const timeoutPromise = new Promise<AppUser | null>(resolve =>
          setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS),
        );
        const authPromise = (async (): Promise<AppUser | null> => {
          await offlineQueueService.init().catch(() => {});
          return authService.getCurrentUser();
        })();
        user = await Promise.race([authPromise, timeoutPromise]);
        if (user && !cancelled) authStore.setUser(user);
      } catch (err) {
        logger.warn('Bootstrap auth error:', err);
      } finally {
        if (!cancelled) authStore.setLoading(false);
      }

      if (!cancelled) setBootstrapComplete(true);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { bootstrapComplete };
}
