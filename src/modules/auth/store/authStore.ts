import { create } from 'zustand';
import type { AppUser } from '@shared/types';
import type { DeletionRequest } from '../services/accountDeletionService';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  showAlbumsModal: boolean;
  hideFloatingAvatar: boolean;
  pendingDeletion: DeletionRequest | null;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setShowAlbumsModal: (v: boolean) => void;
  setHideFloatingAvatar: (v: boolean) => void;
  setPendingDeletion: (req: DeletionRequest | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: true,
  showAlbumsModal: false,
  hideFloatingAvatar: false,
  pendingDeletion: null,
  setUser: user => set({ user }),
  setLoading: isLoading => set({ isLoading }),
  setShowAlbumsModal: showAlbumsModal => set({ showAlbumsModal }),
  setHideFloatingAvatar: hideFloatingAvatar => set({ hideFloatingAvatar }),
  setPendingDeletion: req => set({ pendingDeletion: req }),
}));
