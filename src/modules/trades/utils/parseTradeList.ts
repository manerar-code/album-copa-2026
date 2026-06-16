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
  const rawEntries: ParsedEntry[] = [];

  // Track character ranges consumed by Pass 1 to avoid double-counting in Pass 2
  const consumedRanges: Array<[number, number]> = [];

  // Pass 1 — section block format: PREFIX: 1, 2, 3
  const pass1Regex = /([A-Za-z]{2,4})\s*:\s*([\d][,;\s\d]*)/g;
  let match: RegExpExecArray | null;

  while ((match = pass1Regex.exec(text)) !== null) {
    const prefix = match[1].toUpperCase();
    const numberBlock = match[2];
    const rangeStart = match.index;
    const rangeEnd = match.index + match[0].length;
    consumedRanges.push([rangeStart, rangeEnd]);

    const numbers = numberBlock.split(/[,;\s]+/).filter(n => /^\d+$/.test(n));
    for (const num of numbers) {
      rawEntries.push({ codigoFifa: prefix, numero: stripLeadingZeros(num) });
    }
  }

  // Pass 2 — concatenated format: PREFIX01 or PREFIX-01
  const pass2Regex = /([A-Za-z]{2,4})-?(\d+)/g;

  while ((match = pass2Regex.exec(text)) !== null) {
    const spanStart = match.index;
    const spanEnd = match.index + match[0].length;

    // Skip spans already consumed by Pass 1
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
  const hasNoPrefix = entries.length === 0 && /\d/.test(text);

  return { entries, hasNoPrefix, unresolvableCount: 0 };
}
