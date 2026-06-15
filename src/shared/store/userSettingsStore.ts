import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage/keys';

// Tipos fixos — sempre controlados, o usuario nao pode desmarcar
export const FIXED_TYPES = ['Player', 'Foil Player'];

// Renomeia tipos para exibição na UI
export const TYPE_DISPLAY: Record<string, string> = {
  'Foil Player': 'Brilhante',
  Silver: 'Silver',
  Player: 'Player',
  foil: 'Brilhante',
  silver: 'Silver',
  player: 'Player',
};

export function displayType(type: string): string {
  return TYPE_DISPLAY[type] ?? type;
}

// Labels de exibição dos tipos fixos (usadas para comparação normalizada)
export const FIXED_TYPE_LABELS = Array.from(new Set(FIXED_TYPES.map(t => displayType(t))));

/**
 * Verifica se um tipo de figurinha está dentro dos tipos rastreados.
 * Usa displayType para normalizar comparações (ex: 'foil' == 'Foil Player' == 'Brilhante').
 */
export function isTypeTracked(
  trackedTypes: string[] | null,
  type: string | null | undefined,
): boolean {
  if (!trackedTypes) return true; // null = ainda carregando = exibe tudo
  if (!type) return true; // sem tipo = figurinha padrão = sempre exibe
  const label = displayType(type);
  return trackedTypes.includes(label);
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
    // Normaliza para labels de exibição e sempre inclui os tipos fixos
    const normalized = types.map(t => displayType(t));
    const final = Array.from(new Set([...normalized, ...FIXED_TYPE_LABELS]));
    set({ trackedTypes: final });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify({ trackedTypes: final }));
  },

  loadSettings: async (allTypes: string[]) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw) as { trackedTypes?: string[] };
        if (parsed.trackedTypes) {
          // Normaliza valores antigos (podem estar em formato raw, ex: 'foil') para labels
          const normalized = parsed.trackedTypes.map(t => displayType(t));
          const merged = Array.from(new Set([...normalized, ...FIXED_TYPE_LABELS]));
          set({ trackedTypes: merged });
          return;
        }
      }
    } catch {
      // fallback abaixo — erro silencioso, usa defaults
    }
    // Default: todos os tipos normalizados + sempre inclui os tipos fixos
    const allLabels = allTypes.map(t => displayType(t));
    set({ trackedTypes: Array.from(new Set([...allLabels, ...FIXED_TYPE_LABELS])) });
  },
}));
