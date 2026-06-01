import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage/keys';

// Tipos fixos — nunca aparecem na configuração (sempre controlados)
export const FIXED_TYPES = ['Foil Player', 'Silver'];

// Renomeia tipos para exibição na UI
export const TYPE_DISPLAY: Record<string, string> = {
  'Foil Player': 'Brilhante',
};

export function displayType(type: string): string {
  return TYPE_DISPLAY[type] ?? type;
}

interface UserSettingsState {
  // null = ainda não carregou (usa todos)
  trackedTypes: string[] | null;
  setTrackedTypes: (types: string[]) => Promise<void>;
  loadSettings: (allTypes: string[]) => Promise<void>;
}

export const useUserSettingsStore = create<UserSettingsState>(set => ({
  trackedTypes: null,

  setTrackedTypes: async (types: string[]) => {
    // Sempre inclui os tipos fixos
    const final = Array.from(new Set([...types, ...FIXED_TYPES]));
    set({ trackedTypes: final });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify({ trackedTypes: final }));
  },

  loadSettings: async (allTypes: string[]) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw) as { trackedTypes?: string[] };
        if (parsed.trackedTypes) {
          const merged = Array.from(new Set([...parsed.trackedTypes, ...FIXED_TYPES]));
          set({ trackedTypes: merged });
          return;
        }
      }
    } catch {}
    // Default: todos os tipos
    set({ trackedTypes: allTypes });
  },
}));
