import { create } from 'zustand';

export interface SyncState {
  status: 'synced' | 'pending' | 'offline' | 'syncing';
  pendingCount: number;
  setStatus: (s: SyncState['status']) => void;
  setPendingCount: (n: number) => void;
}

export const useSyncStore = create<SyncState>(set => ({
  status: 'synced',
  pendingCount: 0,

  setStatus: status => set({ status }),
  setPendingCount: pendingCount => set({ pendingCount }),
}));
