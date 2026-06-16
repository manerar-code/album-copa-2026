---
status: completed
title: "Refactor TradesScreen to unified inline layout with CromoCards"
type: frontend
complexity: high
dependencies: [task_01]
---

## Overview

Replace the two-view state machine in `TradesScreen` with a single `SectionList`-based screen. The "Comparar" button and `ViewState` are removed; comparison becomes reactive via `useMemo` on `inputText`, producing a `TradeState` object that drives rendering automatically. The result section renders CromoCard grids grouped by country — visually identical to `DuplicatesScreen` — replacing the current plain-number rows. All 14 existing integration tests are deleted and rewritten with 16 new cases covering the unified flow.

<critical>
- Read the TechSpec "Component Changes — TradesScreen.tsx" section fully before starting.
- Reference ADR-001 (single-screen layout), ADR-002 (useMemo reactivity), and ADR-003 (parseTradeList signature).
- Do NOT add debounce or useEffect for the comparison — use useMemo directly on inputText per ADR-002.
- Do NOT create new files or directories — all changes stay in existing files under `src/modules/trades/`.
- Tests are required: delete all 14 old tests, write ≥ 16 new tests before marking complete.
</critical>

<requirements>
1. `ViewState` type and `viewState` useState MUST be removed entirely.
2. `handleComparar()` and `handleReset()` functions MUST be removed.
3. A `useMemo` keyed on `[inputText, selecoes, figurinhas, collection]` MUST produce a `TradeState | null` value; this replaces the prior `result` useState, `parseError` useState, and `parsePreview` useMemo.
4. `runComparison` MUST accept `ParseResult` as its first argument (instead of raw `inputText`) to avoid a second `parseTradeList` call.
5. `TradeSection` MUST include `flag: string` and `tc: { f1: string; f2: string }` fields, populated inside `runComparison` using `teamFlagEmoji` and `teamColors`/`defaultTeamColors`.
6. The JSX MUST render a single `SectionList` with `keyboardShouldPersistTaps="handled"`. The `ListHeaderComponent` MUST contain the "album complete" info box (conditional), label row, TextInput, parseError box (conditional), and preview text (conditional).
7. `renderItem` MUST render a CromoCard grid at `index === 0` and return `null` for all other indices — identical to `DuplicatesScreen` pattern.
8. `ListFooterComponent` MUST render the WhatsApp share button only when `totalCount > 0`.
9. `ListEmptyComponent` MUST show "Todas as figurinhas do amigo você já tem" empty state only when `tradeState?.result` is non-null AND `sections.length === 0`. It MUST NOT render when `tradeState` is null (empty input).
10. `handleClearText()` with `Alert.alert` confirmation MUST be retained unchanged.
11. Styles `compareBtn`, `compareBtnDisabled`, `compareBtnText`, `numberRow`, `numberText`, `emptyContainer`, `footer`, `resetBtn`, `resetBtnText` MUST be removed.
12. Style `cromoGrid` MUST be added matching `DuplicatesScreen` dimensions.
13. All 14 existing integration tests MUST be deleted. At least 16 new tests MUST be written per the TechSpec Testing Strategy table.
14. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Remove `ViewState`, `viewState` state, `result` state, `parseError` state, `handleComparar`, `handleReset`
- [x] Update `runComparison` to accept `ParseResult`; enrich `TradeSection` with `flag` and `tc`
- [x] Add `useMemo`-based `TradeState` combining parse + comparison in one pass
- [x] Restructure JSX: single `SectionList`, `ListHeaderComponent` with TextInput, `ListFooterComponent` with share button
- [x] Replace `renderItem` number rows with CromoCard grid (`state="missing"`, `width={96}`)
- [x] Clean up imports (add `CromoCard`, `teamFlagEmoji`, `teamColors`, `defaultTeamColors`; remove `ScrollView`)
- [x] Delete all 14 old tests in `TradesScreen.test.tsx`; write 18 new tests per TechSpec table

## Implementation Details

- Modify `src/modules/trades/screens/TradesScreen.tsx` — major refactor per TechSpec "Component Changes" section
- Modify `src/tests/integration/TradesScreen.test.tsx` — full test rewrite per TechSpec "Testing Strategy" table

See TechSpec sections: "Core Interfaces", "Component Changes — TradesScreen.tsx", "Data Flow", "Testing Strategy".

### Relevant Files
- `src/modules/trades/screens/TradesScreen.tsx` — primary file being refactored
- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — reference implementation for SectionList + CromoCard pattern
- `src/modules/trades/utils/parseTradeList.ts` — updated in task_01; call without `selecoes` argument
- `src/modules/trades/utils/formatTradeResult.ts` — used by `handleShare`; interface is `(matches: TradeMatch[], albumName: string)`
- `src/core/theme/index.ts` — source of `teamFlagEmoji`, `teamColors`, `defaultTeamColors`
- `src/shared/components/CromoCard.tsx` — props: `numero`, `descricao`, `flag`, `f1`, `f2`, `state`, `width`
- `src/shared/components/FlagImage.tsx` — props: `codigoFifa`, `bandeiraUrl`, `size`

### Dependent Files
- `src/tests/integration/TradesScreen.test.tsx` — complete rewrite; part of this task

### Related ADRs
- [ADR-001: Unified Inline Comparison with Live CromoCard Result](adrs/adr-001.md)
- [ADR-002: Reactive Comparison via useMemo — No Debounce](adrs/adr-002.md)
- [ADR-003: Remove selecoes Parameter from parseTradeList](adrs/adr-003.md)

## Deliverables

- `TradesScreen.tsx` with no `ViewState`, no "Comparar" button, reactive `useMemo` comparison, CromoCard grid result
- `TradesScreen.test.tsx` with all 14 old tests removed and ≥ 16 new tests passing
- TypeScript compilation with no new errors

## Tests

### Unit Tests
- [ ] `TradeState` useMemo: `inputText = ''` → `tradeState` is `null` (no sections rendered)
- [ ] `TradeState` useMemo: `inputText = '1;2;10'` (no prefix) → `tradeState.parseError` contains "Nenhum código de país"
- [ ] `TradeState` useMemo: `inputText = 'URU01'` with URU1 `'missing'` → `tradeState.result.totalCount === 1`
- [ ] `runComparison`: sticker with `status = 'owned'` is excluded from result sections
- [ ] `runComparison`: sticker with `status = 'duplicate'` is excluded from result sections
- [ ] `runComparison`: unknown FIFA code (no matching selecao) increments `catalogMissCount` and is not included in sections

### Integration Tests
- [ ] Renders TextInput with placeholder text on mount; no sections visible
- [ ] ✕ Limpar button is absent when `inputText` is empty
- [ ] ✕ Limpar button appears when `inputText` is non-empty
- [ ] ✕ Limpar button triggers `Alert.alert` with "Apagar lista?" title
- [ ] Pasting `'URU01 BRA07'` (both stickers `'missing'`) renders two section headers without pressing any button
- [ ] Pasting `'1;2;10'` shows parseError box containing "Nenhum código"; no section headers rendered
- [ ] Pasting `'URU01'` when URU1 is `'owned'` → "Todas as figurinhas" empty state visible; no section headers
- [ ] Section header shows country name text and sticker count
- [ ] `renderItem` at `index === 0` renders `CromoCard` for each matching figurinha in the section
- [ ] `renderItem` at `index > 0` renders nothing (null)
- [ ] WhatsApp share button is absent when `totalCount === 0`
- [ ] WhatsApp share button is present when `totalCount > 0`
- [ ] Pressing WhatsApp share calls `Share.share` with message containing the team FIFA code
- [ ] Setting `inputText` to `''` (clearing) removes all sections
- [ ] Album complete info box visible when `stats.missing === 0`
- [ ] `collection` state is never mutated during any interaction (toggleSticker/setStatus not called)

## Success Criteria

- All ≥ 16 new integration tests passing
- TypeScript compilation passes with no new errors
- No `ViewState`, `handleComparar`, or `handleReset` references remain in `TradesScreen.tsx`
- CromoCard grid visually matches `DuplicatesScreen` grid pattern (confirmed by reading `DuplicatesScreen.tsx` as reference)
- Test coverage ≥ 80% for `TradesScreen.tsx`
