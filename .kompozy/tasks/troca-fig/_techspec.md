# TechSpec: Sticker Trade Comparison — Unified Inline Screen (Troca_Fig)

**Feature:** Troca_Fig  
**Date:** 2026-06-16  
**Status:** Draft  
**PRD:** `.kompozy/tasks/troca-fig/_prd.md`

---

## Executive Summary

Replace the two-view state machine in `TradesScreen` with a single `SectionList`-based screen. Comparison is reactive — driven by `useMemo` on `inputText` — eliminating the "Comparar" button and `ViewState` entirely. The result renders as a CromoCard grid grouped by country, structurally identical to `DuplicatesScreen`. The primary trade-off is that all 14 existing integration tests are deleted and rewritten, and `parseTradeList`'s unused `selecoes` parameter is removed, requiring a mechanical update across all 37 unit test call sites.

No new files, no new directories. All changes are confined to existing files under `src/modules/trades/`.

---

## Goals (mapped from PRD)

| PRD Goal | Technical Implementation |
|----------|--------------------------|
| Zero button presses between paste and result | `useMemo` on `inputText` computes `TradeState` on every change |
| Accept any text format with FIFA codes | `parseTradeList` (existing logic, no changes) |
| CromoCard grid grouped by country | `renderItem` with enriched `TradeSection` (adds `flag`, `tc`) |
| Single scrollable screen | `SectionList` with `ListHeaderComponent` holding the TextInput |
| WhatsApp share from same screen | `ListFooterComponent` with share button |
| ✕ Limpar with confirmation | `Alert.alert` in `handleClearText` (existing, retained) |

---

## Core Interfaces

### TradeState (new)

```typescript
interface TradeState {
  result: ComparisonResult | null;  // null when no valid codes found
  parseError: string | null;        // set when hasNoPrefix is true
  preview: string | null;           // "N figurinhas em X seleções"
}
```

`TradeState` collapses three prior `useState` variables (`parseError`, `parsePreview`, `result`) into a single memoized object. It is never stored in state — only derived.

### TradeSection (updated)

```typescript
interface TradeSection {
  title: string;
  codigoFifa: string;
  bandeira_url: string;
  flag: string;                    // teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴'
  tc: { f1: string; f2: string };  // teamColors[codigoFifa] ?? defaultTeamColors
  data: Figurinha[];
}
```

`flag` and `tc` are added so `renderItem` can pass them to `CromoCard` without a secondary lookup per render. This mirrors the `DuplicatesScreen` section structure.

### ComparisonResult (unchanged)

```typescript
interface ComparisonResult {
  sections: TradeSection[];
  totalCount: number;
  parsedCount: number;
  catalogMissCount: number;
}
```

### parseTradeList (signature change)

```typescript
// Before:
export function parseTradeList(text: string, selecoes: Selecao[]): ParseResult

// After:
export function parseTradeList(text: string): ParseResult
```

See ADR-003.

---

## Component Changes

### `src/modules/trades/utils/parseTradeList.ts`

- Remove `selecoes: Selecao[]` parameter and the `void selecoes;` line.
- Remove `import type { Selecao }` (becomes unused).
- No logic changes — `ParseResult` output is identical.

### `src/modules/trades/screens/TradesScreen.tsx`

#### State — removed

```typescript
// DELETE these:
const [viewState, setViewState] = useState<ViewState>('input');
const [result, setResult] = useState<ComparisonResult | null>(null);
const [parseError, setParseError] = useState<string | null>(null);
```

#### State — added

```typescript
// Single derived value replaces three useState + one useMemo:
const tradeState = useMemo<TradeState | null>(() => {
  const text = inputText.trim();
  if (!text) return null;

  const parsed = parseTradeList(text);

  if (parsed.hasNoPrefix) {
    return {
      result: null,
      parseError:
        'Nenhum código de país encontrado. Peça ao amigo para enviar a lista com o código da seleção (ex: BRA01, URU: 1, 2).',
      preview: null,
    };
  }

  if (parsed.entries.length === 0) return null;

  const selecaoSet = new Set(parsed.entries.map(e => e.codigoFifa));
  const preview = `${parsed.entries.length} figurinhas encontradas em ${selecaoSet.size} seleção(ões)`;
  const result = runComparison(parsed, selecoes, figurinhas, collection);

  return { result, parseError: null, preview };
}, [inputText, selecoes, figurinhas, collection]);
```

#### Functions — removed

- `handleComparar()` — replaced by reactive `useMemo`
- `handleReset()` — no longer needed (clearing `inputText` resets state automatically)

#### Functions — retained unchanged

- `handleClearText()` — `Alert.alert` confirmation before `setInputText('')`
- `handleShare()` — reads `tradeState?.result` instead of `result`

#### `runComparison` — signature change

Accept `ParseResult` as first argument to avoid a second `parseTradeList` call:

```typescript
function runComparison(
  parseResult: ParseResult,
  selecoes: Selecao[],
  figurinhas: Figurinha[],
  collection: Record<string, string>,
): ComparisonResult | null
```

`runComparison` MUST enrich each section with `flag` and `tc`:

```typescript
const sections: TradeSection[] = Array.from(sectionMap.values()).map(
  ({ selecao, figurinhas: figs }) => ({
    title: selecao.nome,
    codigoFifa: selecao.codigo_fifa,
    bandeira_url: selecao.bandeira_url,
    flag: teamFlagEmoji[selecao.codigo_fifa.toUpperCase()] ?? '🏴',
    tc: teamColors[selecao.codigo_fifa] ?? defaultTeamColors,
    data: figs,
  }),
);
```

#### JSX structure

The component renders a single branch (no `if (viewState === 'result')` split):

```
<SafeAreaView>
  <ScreenHeader title="🤝 Trocas" subtitle="Cole a lista de repetidas do amigo" />
  <SectionList
    sections={tradeState?.result?.sections ?? []}
    keyExtractor={item => item.id}
    contentContainerStyle={s.list}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<TradesInputHeader ... />}
    ListFooterComponent={totalCount > 0 ? <TradesShareFooter ... /> : null}
    ListEmptyComponent={parseError || !tradeState ? null : <EmptyState ... />}
    renderSectionHeader={({ section }) => (
      <View style={s.sectionHeader}>
        <FlagImage codigoFifa={section.codigoFifa} bandeiraUrl={section.bandeira_url} size={20} />
        <Text style={s.sectionName}>{section.title}</Text>
        <Text style={s.sectionCount}>{section.data.length} fig.</Text>
      </View>
    )}
    renderItem={({ index, section }) => {
      if (index !== 0) return null;
      return (
        <View style={s.cromoGrid}>
          {section.data.map(f => (
            <CromoCard
              key={f.id}
              numero={f.numero}
              descricao={f.descricao}
              flag={section.flag}
              f1={section.tc.f1}
              f2={section.tc.f2}
              state="missing"
              width={96}
            />
          ))}
        </View>
      );
    }}
  />
</SafeAreaView>
```

`ListHeaderComponent` contains (inline or as an extracted const inside the component):
- Optional "album complete" info box
- `labelRow`: label text + ✕ Limpar `TouchableOpacity`
- `TextInput` (multiline, `onChangeText={t => setInputText(t.toUpperCase())}`)
- Optional `parseError` red box
- Optional `preview` green text

`ListEmptyComponent` shows "Todas as figurinhas do amigo você já tem ✅" only when `tradeState?.result` exists but `sections.length === 0`. It MUST NOT show when `tradeState` is null (input empty).

#### Imports — added

```typescript
import { CromoCard } from '@shared/components/CromoCard';
import { teamFlagEmoji, teamColors, defaultTeamColors } from '@core/theme';
import type { ParseResult } from '../utils/parseTradeList';
```

#### Imports — removed

```typescript
import { Share, ScrollView } from 'react-native';  // ScrollView removed (SectionList handles scroll)
// Share is still needed for handleShare
```

#### Styles — removed

`compareBtn`, `compareBtnDisabled`, `compareBtnText`, `numberRow`, `numberText`, `emptyContainer`, `footer`, `resetBtn`, `resetBtnText`

#### Styles — added

```typescript
cromoGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 14,
  marginBottom: spacing.md,
  justifyContent: 'flex-start',
},
```

---

## Data Flow

```
User pastes/types text
  → onChangeText: setInputText(text.toUpperCase())
  → React re-render
  → useMemo [inputText, selecoes, figurinhas, collection]
      → parseTradeList(text)            [one call]
      → runComparison(parseResult, ...) [one call]
      → TradeState { result, parseError, preview }
  → SectionList re-renders with new sections
  → CromoCard grid visible below TextInput
```

---

## Development Sequencing

1. **Update `parseTradeList.ts`** — Remove `selecoes` parameter; no logic changes. No dependencies.

2. **Update `parseTradeList.test.ts`** *(depends on step 1)* — Remove the second argument from all 37 `parseTradeList(text, selecoes)` call sites. All test assertions remain identical.

3. **Refactor `TradesScreen.tsx`** *(depends on step 1)* — Remove ViewState machine; add `useMemo`-based `TradeState`; update `runComparison` signature; restructure JSX to single `SectionList`; add CromoCard grid in `renderItem`; add `flag`/`tc` to `TradeSection`.

4. **Rewrite `TradesScreen.test.tsx`** *(depends on step 3)* — Delete all 14 tests; write ≥ 14 new tests for the unified flow. See Testing Strategy below.

---

## Testing Strategy

### `parseTradeList.test.ts` — mechanical update (37 tests)

Remove the second argument from every call site. Example:

```typescript
// Before:
parseTradeList('URU01 URU2', ALL_SELECOES)

// After:
parseTradeList('URU01 URU2')
```

All `expect` assertions are unchanged.

### `TradesScreen.test.tsx` — full rewrite (≥ 14 new tests)

| # | Test description |
|---|-----------------|
| 1 | Renders TextInput with placeholder on mount |
| 2 | ✕ Limpar button is absent when input is empty |
| 3 | ✕ Limpar button appears when input has text |
| 4 | ✕ Limpar button triggers `Alert.alert` before clearing |
| 5 | Pasting `'URU01 BRA07'` renders CromoCard sections without pressing any button |
| 6 | Pasting `'1;2;10'` (no prefix) shows parseError text; no sections rendered |
| 7 | Pasting codes for stickers all marked `'owned'` shows "Todas as figurinhas" empty state |
| 8 | Section header shows team name and sticker count |
| 9 | `renderItem` at index 0 renders CromoCard for each matching figurinha |
| 10 | `renderItem` at index > 0 renders nothing |
| 11 | WhatsApp share button is absent when `totalCount === 0` |
| 12 | WhatsApp share button is present when `totalCount > 0` |
| 13 | Pressing share calls `Share.share` with message containing the team FIFA code |
| 14 | Clearing input text (setting to `''`) removes all sections |
| 15 | Album complete info box visible when `stats.missing === 0` |
| 16 | Unknown FIFA code in input (e.g., `'XYZ01'`) is silently ignored — no error shown, no sections |

---

## Architecture Decision Records

- [ADR-001: Unified Inline Comparison with Live CromoCard Result](adrs/adr-001.md) — Single scrollable screen chosen over two-view auto-transition and split-screen layouts.
- [ADR-002: Reactive Comparison via useMemo — No Debounce](adrs/adr-002.md) — `useMemo` on `inputText` chosen over `useEffect`+debounce and custom hook.
- [ADR-003: Remove selecoes Parameter from parseTradeList](adrs/adr-003.md) — Dead parameter removed; 37 unit test call sites updated mechanically.
