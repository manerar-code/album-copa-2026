import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from '@shared/services/supabase';
import { handleError } from '@shared/services/errorHandler';
import { logger } from '@shared/utils/logger';
import type { AppUser } from '@shared/types';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  /** Faz login com Google via OAuth */
  async signInWithGoogle(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // No web o Supabase redireciona nativamente pelo browser
        // eslint-disable-next-line no-undef
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: origin },
        });
        if (error) throw error;
        return;
      }

      // Nativo (iOS / Android) — usa expo-web-browser
      const redirectTo = makeRedirectUri({ scheme: 'album-copa-2026', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        const hashPart = url.includes('#') ? url.split('#')[1] : (url.split('?')[1] ?? '');
        // eslint-disable-next-line no-undef
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (error) {
      throw handleError(error, 'authService.signInWithGoogle');
    }
  },

  /** Faz logout */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw handleError(error, 'authService.signOut');
    }
  },

  /** Verifica se tem sessão ativa e retorna o usuário */
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return null;
      const u = session.user;
      return {
        id: u.id,
        email: u.email ?? '',
        name: u.user_metadata?.full_name ?? u.email ?? 'Usuário',
        avatar_url: u.user_metadata?.avatar_url,
      };
    } catch (error) {
      logger.warn('Could not get current user:', error);
      return null;
    }
  },
};
