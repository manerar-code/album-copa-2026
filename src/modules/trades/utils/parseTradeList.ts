export interface ParsedEntry {
  codigoFifa: string;
  numero: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  hasNoPrefix: boolean;
  unresolvableCount: number;
}

function stripLeadingZeros(num: string): string {
  const stripped = num.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

export function parseTradeList(text: string): ParseResult {
  const normalizedText = text
    // Strip Unicode tag sequences (U+E0000-U+E007F) from subdivision flag emojis
    // e.g. Scotland 󠁧󠁢󠁳󠁣󠁴󠁿 / England 󠁧󠁢󠁥󠁮󠁧󠁿 — invisible chars that appear between ":" and the number in pasted text
    .replace(/\u{E0000}/gu, '')
    .replace(/[\u{E0001}-\u{E007F}]/gu, '')
    // Replace remaining non-ASCII characters (emoji, symbols) with a space
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, ' ')
    // Normalize Portuguese conjunction "e"/"E" as number separator
    // e.g. "BRA: 9 e 11" → "BRA: 9, 11" — requires whitespace on both sides
    .replace(/\s+[Ee]\s+/g, ', ');

  const rawEntries: ParsedEntry[] = [];

  // Track character ranges consumed to avoid double-counting in later passes
  const consumedRanges: Array<[number, number]> = [];
  let match: RegExpExecArray | null;

  // Pass 0a — CC section format: CC-LAM: 10, 14  (must run before Pass 1/2)
  const pass0SectionRegex = /(CC-[A-Za-z]{1,4})\s*:\s*([\d][,;\s\d]*)/gi;
  while ((match = pass0SectionRegex.exec(normalizedText)) !== null) {
    const prefix = match[1].toUpperCase();
    consumedRanges.push([match.index, match.index + match[0].length]);
    const numbers = match[2].split(/[,;\s]+/).filter(n => /^\d+$/.test(n));
    for (const num of numbers) {
      rawEntries.push({ codigoFifa: prefix, numero: stripLeadingZeros(num) });
    }
  }

  // Pass 0b — CC concatenated format: CC-LAM10  (must run before Pass 2 to avoid "LAM10" → {LAM,10})
  const pass0ConcatRegex = /(CC-[A-Za-z]{1,4})(\d+)/gi;
  while ((match = pass0ConcatRegex.exec(normalizedText)) !== null) {
    const spanStart = match.index;
    const spanEnd = match.index + match[0].length;
    const overlaps = consumedRanges.some(([s, e]) => spanStart < e && spanEnd > s);
    if (overlaps) continue;
    consumedRanges.push([spanStart, spanEnd]);
    rawEntries.push({ codigoFifa: match[1].toUpperCase(), numero: stripLeadingZeros(match[2]) });
  }

  // Pass 1 — section block format: "PREFIX: 1, 2, 3" or "PREFIX 1, 2, 3" (colon optional)
  // Colon-optional handles formats like "DEU 5, 9 e 16" (common in WhatsApp lists)
  const pass1Regex = /([A-Za-z]{2,4})\s*:?\s*([\d][,;\s\d]*)/g;

  while ((match = pass1Regex.exec(normalizedText)) !== null) {
    const rangeStart = match.index;
    const rangeEnd = match.index + match[0].length;

    // Skip spans already consumed by Pass 0
    const overlaps = consumedRanges.some(([s, e]) => rangeStart < e && rangeEnd > s);
    if (overlaps) continue;

    const prefix = match[1].toUpperCase();
    const numberBlock = match[2];
    consumedRanges.push([rangeStart, rangeEnd]);

    const numbers = numberBlock.split(/[,;\s]+/).filter(n => /^\d+$/.test(n));
    for (const num of numbers) {
      rawEntries.push({ codigoFifa: prefix, numero: stripLeadingZeros(num) });
    }
  }

  // Pass 2 — concatenated format: PREFIX01 or PREFIX-01
  const pass2Regex = /([A-Za-z]{2,4})-?(\d+)/g;

  while ((match = pass2Regex.exec(normalizedText)) !== null) {
    const spanStart = match.index;
    const spanEnd = match.index + match[0].length;

    // Skip spans already consumed by earlier passes
    const overlaps = consumedRanges.some(([s, e]) => spanStart < e && spanEnd > s);
    if (overlaps) continue;

    rawEntries.push({ codigoFifa: match[1].toUpperCase(), numero: stripLeadingZeros(match[2]) });
  }

  // Deduplicate by (codigoFifa, numero)
  const seen = new Set<string>();
  const entries: ParsedEntry[] = [];
  for (const entry of rawEntries) {
    const key = `${entry.codigoFifa}:${entry.numero}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push(entry);
    }
  }

  // hasNoPrefix: no prefixed entries found AND input contains digits
  const hasNoPrefix = entries.length === 0 && /\d/.test(normalizedText);

  return { entries, hasNoPrefix, unresolvableCount: 0 };
}
