import { create } from 'zustand';
import type { AppUser } from '@shared/types';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  showAlbumsModal: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setShowAlbumsModal: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: true,
  showAlbumsModal: false,
  setUser: user => set({ user }),
  setLoading: isLoading => set({ isLoading }),
  setShowAlbumsModal: showAlbumsModal => set({ showAlbumsModal }),
}));
