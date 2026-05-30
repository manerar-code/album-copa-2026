export const colors = {
  primary: '#0A2342',
  secondary: '#2ECC71',
  accent: '#F1C40F',
  background: '#F8F9FA',
  white: '#FFFFFF',
  error: '#E74C3C',

  // Sticker states
  missing: {
    background: '#E8E8E8',
    text: '#999999',
    border: '#D0D0D0',
  },
  owned: {
    background: '#D5F5E3',
    text: '#1E8449',
    border: '#2ECC71',
  },
  duplicate: {
    background: '#FEF9E7',
    text: '#B7950B',
    border: '#F1C40F',
  },

  // UI
  border: '#E5E5E5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  cardShadow: 'rgba(0,0,0,0.06)',
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
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '700' as const },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};
