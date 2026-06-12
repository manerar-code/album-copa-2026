import { useEffect, useRef, type MutableRefObject } from 'react';
import { supabase } from '@shared/services/supabase';
import { useAuthStore } from '@modules/auth/store/authStore';

export function useAuthListener(
  onSignIn: (isNew: boolean) => void,
  onSignOut: () => void,
  bootstrapSyncedUserId?: MutableRefObject<string | null>,
): void {
  const bootstrappedRef = useRef<string | null>(null);

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
        useAuthStore.getState().setUser(user);

        const previousId = bootstrapSyncedUserId?.current ?? bootstrappedRef.current;
        const isNew = previousId != null && previousId !== user.id;
        bootstrappedRef.current = null;
        if (bootstrapSyncedUserId) bootstrapSyncedUserId.current = null;

        onSignIn(isNew);
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
      }
    });

    return () => subscription.unsubscribe();
  }, [onSignIn, onSignOut, bootstrapSyncedUserId]);
}
