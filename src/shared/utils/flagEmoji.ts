// Maps FIFA code → ISO 3166-1 alpha-2 (used by flagcdn.com)
const FIFA_TO_ISO2: Record<string, string> = {
  // América do Sul
  BRA: 'br',
  ARG: 'ar',
  URU: 'uy',
  COL: 'co',
  CHI: 'cl',
  PER: 'pe',
  ECU: 'ec',
  PAR: 'py',
  VEN: 've',
  BOL: 'bo',
  // América do Norte / Central / Caribe
  USA: 'us',
  MEX: 'mx',
  CAN: 'ca',
  CRC: 'cr',
  PAN: 'pa',
  JAM: 'jm',
  HON: 'hn',
  SLV: 'sv',
  GUA: 'gt',
  TRI: 'tt',
  CUB: 'cu',
  HAI: 'ht',
  // Europa
  FRA: 'fr',
  GER: 'de',
  ESP: 'es',
  POR: 'pt',
  ENG: 'gb-eng',
  NED: 'nl',
  BEL: 'be',
  ITA: 'it',
  CRO: 'hr',
  SUI: 'ch',
  DEN: 'dk',
  AUT: 'at',
  POL: 'pl',
  SRB: 'rs',
  SCO: 'gb-sct',
  WAL: 'gb-wls',
  SVK: 'sk',
  SVN: 'si',
  CZE: 'cz',
  HUN: 'hu',
  ROU: 'ro',
  UKR: 'ua',
  TUR: 'tr',
  GRE: 'gr',
  NOR: 'no',
  SWE: 'se',
  FIN: 'fi',
  ISL: 'is',
  ALB: 'al',
  GEO: 'ge',
  // África
  MAR: 'ma',
  SEN: 'sn',
  NGA: 'ng',
  GHA: 'gh',
  CMR: 'cm',
  CIV: 'ci',
  EGY: 'eg',
  TUN: 'tn',
  ALG: 'dz',
  RSA: 'za',
  MLI: 'ml',
  BEN: 'bj',
  GUI: 'gn',
  DRC: 'cd',
  // Ásia
  JPN: 'jp',
  KOR: 'kr',
  AUS: 'au',
  IRN: 'ir',
  KSA: 'sa',
  QAT: 'qa',
  UAE: 'ae',
  IRQ: 'iq',
  UZB: 'uz',
  CHN: 'cn',
  // Oceania
  NZL: 'nz',
};

export function getFlagIsoCode(codigoFifa: string): string | null {
  return FIFA_TO_ISO2[codigoFifa.toUpperCase()] ?? null;
}

export function getFlagUrl(codigoFifa: string): string {
  const iso = getFlagIsoCode(codigoFifa);
  return iso ? `https://flagcdn.com/w40/${iso}.png` : '';
}

export function getFlagEmoji(codigoFifa: string): string {
  const iso = getFlagIsoCode(codigoFifa);
  if (!iso) return '';
  const codePoints = iso
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + (char.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}
