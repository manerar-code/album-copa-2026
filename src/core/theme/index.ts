// Design tokens — Álbum Copa 2026 (dark premium redesign)
// Fonts: Archivo (display/numbers), Manrope (body/UI), JetBrains Mono (codes)
// Install: @expo-google-fonts/archivo @expo-google-fonts/manrope @expo-google-fonts/jetbrains-mono
// Until installed, falls back to system fonts below.

// Font family names — must match exactly what was registered in useFonts() in App.tsx
export const fonts = {
  display: 'Archivo', // Archivo_800ExtraBold — headings, big numbers, brand
  displayBold: 'Archivo-Bold', // Archivo_700Bold
  displayMedium: 'Archivo-Medium', // Archivo_500Medium
  body: 'Manrope', // Manrope_400Regular — default UI
  bodySemiBold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
  bodyExtraBold: 'Manrope-ExtraBold',
  mono: 'JetBrains Mono', // JetBrainsMono_500Medium — codes, sticker nums
  monoBold: 'JetBrains Mono Bold',
};

export const colors = {
  // App background layers
  appBg: '#0A0F1C',
  appBg2: '#090D18',

  // Ink scale (dark surfaces)
  ink900: '#0A0F1C',
  ink850: '#0C1322',
  ink800: '#101A2E',
  ink750: '#13203A',

  // Gold accent — primary accent, progress, active states, key numbers, buttons
  gold: '#E7B43C',
  goldSoft: '#F2CE72',
  goldDeep: '#B07F22',

  // Status colors
  green: '#2BD17E', // "Tenho" (owned), completed
  red: '#FF5D52', // "Faltam" (missing)
  blue: '#5B9BFF', // ambient accent only

  // Text
  tx: '#EEF2F8', // primary text
  txMut: '#9AA6BE', // secondary text
  txFaint: '#646F88', // tertiary / labels / captions

  // Borders
  line: 'rgba(255,255,255,0.09)', // standard hairline border
  lineSoft: 'rgba(255,255,255,0.06)', // subtle divider

  // Glass surfaces
  glass: 'rgba(255,255,255,0.055)', // glass fill
  glass2: 'rgba(255,255,255,0.08)', // slightly stronger glass fill

  // Sticker states (semantic aliases)
  missing: {
    background: 'rgba(255,255,255,0.03)',
    border: 'rgba(231,180,60,0.32)',
    text: '#646F88',
  },
  owned: {
    background: '#101A2E',
    border: '#2BD17E',
    text: '#EEF2F8',
  },
  duplicate: {
    background: '#101A2E',
    border: '#E7B43C',
    text: '#F2CE72',
  },

  // Legacy aliases for backward-compat (progressively remove)
  primary: '#0C1322',
  primaryLight: '#101A2E',
  secondary: '#2BD17E',
  accent: '#E7B43C',
  background: '#090D18',
  surface: '#101A2E',
  white: '#EEF2F8',
  error: '#FF5D52',
  border: 'rgba(255,255,255,0.09)',
  textPrimary: '#EEF2F8',
  textSecondary: '#9AA6BE',
  textMuted: '#646F88',
  cardShadow: 'rgba(0,0,0,0.45)',
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

  // Design-system-specific
  glass: 18, // glass cards
  row: 15, // list rows
  btn: 14, // buttons
  pill: 999, // pills
  flagTile: 11, // flag tiles
  cromo: 11, // cromo outer
  cromoInner: 8.5, // cromo inner panel
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.4 },
  numDisplay: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1 },
};

export const shadows = {
  cromo: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  goldBtn: {
    shadowColor: '#E7B43C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 8,
  },
  popover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 16,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Gradient config objects (use with expo-linear-gradient)
export const gradients = {
  appBg: {
    colors: ['#0B1120', '#090D18'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  header: {
    colors: ['#0C1322', '#0A0F1C'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  goldBtn: {
    colors: ['#F2CE72', '#E7B43C', '#B07F22'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  cromoGold: {
    colors: ['#F6D98C', '#E7B43C', '#9A6E1B', '#E7B43C', '#FBE6A6'] as const,
    start: { x: 0.15, y: 0 },
    end: { x: 0.85, y: 1 },
  },
  heroBand: {
    colors: ['#13203A', '#0C1322'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Team field colors (used in CromoCard)
export const teamColors: Record<string, { f1: string; f2: string }> = {
  MEX: { f1: '#1f7a44', f2: '#0c3d22' },
  BRA: { f1: '#1f8a4c', f2: '#0c4225' },
  CAN: { f1: '#b53038', f2: '#5a161a' },
  CHE: { f1: '#b53038', f2: '#5a161a' },
  KOR: { f1: '#2a4f9e', f2: '#13244a' },
  CZE: { f1: '#23508c', f2: '#0e2342' },
  BIH: { f1: '#15467f', f2: '#0a2140' },
  QAT: { f1: '#6b1437', f2: '#33091b' },
  ZAF: { f1: '#1d7a4f', f2: '#0b3a26' },
  PAW: { f1: '#5b2a82', f2: '#2c123f' },
  FWC: { f1: '#b08311', f2: '#5e4406' },
  HCC: { f1: '#1c6f5a', f2: '#0c3a2f' },
};

export const defaultTeamColors = { f1: '#1A3A6C', f2: '#0A2342' };

// FIFA code → flag emoji (used in CromoCard when bandeiraUrl is a URL, not an emoji)
// Includes both FIFA official codes and ISO 3166-1 alpha-3 aliases to handle either convention in DB.
export const teamFlagEmoji: Record<string, string> = {
  // Americas — CONMEBOL
  ARG: '🇦🇷',
  BRA: '🇧🇷',
  URU: '🇺🇾',
  COL: '🇨🇴',
  PER: '🇵🇪',
  CHI: '🇨🇱',
  CHL: '🇨🇱', // FIFA=CHI, ISO=CHL
  VEN: '🇻🇪',
  ECU: '🇪🇨',
  PAR: '🇵🇾',
  PRY: '🇵🇾', // FIFA=PAR, ISO=PRY
  BOL: '🇧🇴',
  // Americas — CONCACAF
  MEX: '🇲🇽',
  USA: '🇺🇸',
  CAN: '🇨🇦',
  CRC: '🇨🇷',
  CRI: '🇨🇷', // FIFA=CRC, ISO=CRI
  PAN: '🇵🇦',
  JAM: '🇯🇲',
  HAI: '🇭🇹',
  HTI: '🇭🇹', // FIFA=HAI, ISO=HTI
  SLV: '🇸🇻',
  HON: '🇭🇳',
  HND: '🇭🇳', // FIFA=HON, ISO=HND
  GUA: '🇬🇹',
  GTM: '🇬🇹', // FIFA=GUA, ISO=GTM
  CUB: '🇨🇺',
  TRI: '🇹🇹',
  TTO: '🇹🇹', // FIFA=TRI, ISO=TTO
  GUY: '🇬🇾',
  SUR: '🇸🇷',
  DOM: '🇩🇴',
  // Europe
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  FRA: '🇫🇷',
  ESP: '🇪🇸',
  GER: '🇩🇪',
  DEU: '🇩🇪', // FIFA=GER, ISO=DEU
  POR: '🇵🇹',
  PRT: '🇵🇹', // FIFA=POR, ISO=PRT
  NED: '🇳🇱',
  NLD: '🇳🇱', // FIFA=NED, ISO=NLD
  BEL: '🇧🇪',
  SUI: '🇨🇭',
  CHE: '🇨🇭', // FIFA=SUI, ISO=CHE
  CZE: '🇨🇿',
  BIH: '🇧🇦',
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  IRL: '🇮🇪',
  SVK: '🇸🇰',
  SVN: '🇸🇮',
  HRV: '🇭🇷',
  CRO: '🇭🇷', // FIFA=CRO, ISO=HRV
  SRB: '🇷🇸',
  GRE: '🇬🇷',
  GRC: '🇬🇷', // FIFA=GRE, ISO=GRC
  TUR: '🇹🇷',
  AUT: '🇦🇹',
  POL: '🇵🇱',
  DEN: '🇩🇰',
  DNK: '🇩🇰', // FIFA=DEN, ISO=DNK
  NOR: '🇳🇴',
  SWE: '🇸🇪',
  FIN: '🇫🇮',
  ISL: '🇮🇸',
  ROU: '🇷🇴',
  UKR: '🇺🇦',
  HUN: '🇭🇺',
  ALB: '🇦🇱',
  MKD: '🇲🇰',
  MNE: '🇲🇪',
  // Africa
  MAR: '🇲🇦',
  NGA: '🇳🇬',
  GHA: '🇬🇭',
  CMR: '🇨🇲',
  SEN: '🇸🇳',
  CIV: '🇨🇮',
  EGY: '🇪🇬',
  TUN: '🇹🇳',
  ALG: '🇩🇿',
  DZA: '🇩🇿', // FIFA=ALG, ISO=DZA
  RSA: '🇿🇦',
  ZAF: '🇿🇦', // FIFA=RSA, ISO=ZAF
  ETH: '🇪🇹',
  KEN: '🇰🇪',
  TAN: '🇹🇿',
  TZA: '🇹🇿',
  UGA: '🇺🇬',
  ZIM: '🇿🇼',
  ZWE: '🇿🇼',
  GAB: '🇬🇦',
  ANG: '🇦🇴',
  AGO: '🇦🇴',
  // Asia / Middle East
  JPN: '🇯🇵',
  KOR: '🇰🇷',
  AUS: '🇦🇺',
  NZL: '🇳🇿',
  QAT: '🇶🇦',
  KSA: '🇸🇦',
  SAU: '🇸🇦', // FIFA=KSA, ISO=SAU
  IRN: '🇮🇷',
  IRQ: '🇮🇶',
  CHN: '🇨🇳',
  IDN: '🇮🇩',
  THA: '🇹🇭',
  VIE: '🇻🇳',
  VNM: '🇻🇳',
  IND: '🇮🇳',
  OMA: '🇴🇲',
  OMN: '🇴🇲',
  UAE: '🇦🇪',
  JOR: '🇯🇴',
  LBN: '🇱🇧',
  SYR: '🇸🇾',
  // Special sections
  FWC: '🏆',
  PAW: '🅿️',
  HCC: '🌎',
  FWH: '📖',
};

// Legacy export
export const headerGradient = ['#0C1322', '#0A0F1C'] as const;
