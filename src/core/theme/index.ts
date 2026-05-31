export const colors = {
  // Brand — Copa 2026
  primary: '#0A2342', // Navy escuro
  primaryLight: '#1A3A6C', // Navy médio (gradientes)
  secondary: '#00A651', // Verde FIFA
  accent: '#E8B84B', // Ouro Copa
  red: '#E63946', // Vermelho vibrante

  background: '#EEF2F7', // Azul-gelo suave
  surface: '#FFFFFF', // Cards
  white: '#FFFFFF',
  error: '#E63946',

  // Figurinha states
  missing: {
    background: '#EAECF0',
    text: '#8A94A6',
    border: '#D0D5DD',
  },
  owned: {
    background: '#D1FAE5',
    text: '#065F46',
    border: '#00A651',
  },
  duplicate: {
    background: '#FEF3C7',
    text: '#92400E',
    border: '#E8B84B',
  },

  // UI
  border: '#DDE3EC',
  textPrimary: '#0D1B2A',
  textSecondary: '#4A5568',
  textMuted: '#8A94A6',
  cardShadow: 'rgba(10,35,66,0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '700' as const },
};

export const shadows = {
  card: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  strong: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Gradiente padrão dos headers
export const headerGradient = ['#0A2342', '#1A3A6C'] as const;
