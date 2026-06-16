# PRD: Sticker Trade Comparison — Unified Inline Screen (Troca_Fig)

**Feature:** Troca_Fig  
**Date:** 2026-06-16  
**Status:** Draft  

---

## Overview

The Trocas screen currently requires four manual steps: paste text → press "Comparar" → read a plain-number result list → press "Nova comparação" to restart. This redesign collapses those steps to one: paste text, result appears. Sticker codes are extracted automatically from any text format, and the cards the user still needs are displayed as CromoCard grids grouped by country — the same visual language as the Repetidas screen — all on a single scrollable page.

---

## Goals

1. Eliminate all button presses between paste and result.
2. Accept any text containing FIFA-code sticker patterns, regardless of formatting noise (emojis, page numbers, quantity markers, prose).
3. Display the result as CromoCard grids grouped by country, visually consistent with the Repetidas screen.
4. Keep input and result on one scrollable screen — no navigation between views.

---

## User Stories

1. As a collector, when I paste my friend's duplicate list, I immediately see which stickers I need from them — no extra tap required.
2. As a collector, the stickers I need are shown as CromoCards grouped by country, so I can visually identify each one.
3. As a collector, even if the pasted text contains emojis, page numbers, quantity markers like `(x2)`, or unstructured prose, the app still finds all sticker codes.
4. As a collector, I can share the list of stickers I need via WhatsApp directly from the same screen.
5. As a collector, I can clear the input in one tap and the result disappears immediately.

---

## Core Features

### 1. Automatic Live Comparison
The TextInput `onChange` event (debounced ~400 ms) triggers comparison automatically. No "Comparar" button exists. The result section appears below the input in the same scroll view as soon as valid sticker codes are detected.

### 2. Robust Sticker Code Extraction
The parser finds all occurrences of the following patterns anywhere in the input text:
- `PREFIXnumber` concatenated (e.g., `BRA3`, `URU01`)
- `PREFIX: n, n, n` section block (e.g., `BRA: 3, 5, 7`)
- `PREFIXnumber (xN)` quantity-marker format (e.g., `MEX6 (x1)`)

All codes are normalized to uppercase. Leading zeros are stripped. Duplicate entries are deduplicated. Surrounding noise (emojis, flag characters, page labels, quantity markers) is ignored.

### 3. CromoCard Result Grid
The result section mirrors the Repetidas layout: a section header with FlagImage, country name, and sticker count, followed by a CromoCard grid. Only stickers with status `'missing'` in the user's collection are shown. Stickers already `'owned'` or `'duplicate'` are excluded — the user does not need them.

### 4. Inline Input Clear
A ✕ Limpar button is visible whenever the input contains text. Tapping it shows a confirmation dialog before clearing both the input and the result section.

### 5. WhatsApp Share
A share button appears at the bottom of the result section when there are matching stickers. It uses the existing `formatTradeResult` utility to compose the message.

---

## User Experience

**Empty state (no input):** Only the TextInput area is visible with placeholder text explaining the expected input format.

**While typing / after paste:**
- The ✕ Limpar button appears as soon as the input is non-empty.
- After ~400 ms of inactivity, the comparison runs silently.
- If valid sticker codes are found: the result section slides in below — section headers (flag + country name + count) followed by CromoCard grids.
- If no valid codes are found: no result section is shown; the existing "Nenhum código de país encontrado" hint is displayed inline below the input.
- If codes are found but the user already owns all of them: an empty state message "Todas as figurinhas do amigo você já tem ✅" appears in the result area.

**Result section:**
- Visually identical to the Repetidas SectionList: `FlagImage` + country name bold + count faint.
- CromoCard grid with team colors, sticker number, and description.
- WhatsApp share button at the bottom of the last section.

**Clear:** Confirmation dialog before clearing. Clearing removes both the input text and the result section.

---

## Non-Goals

- Saving comparison history or persisting the last-used text across sessions.
- Multi-friend comparison (comparing against multiple lists simultaneously).
- Country name recognition (e.g., "Brasil" → BRA); only FIFA codes embedded in the text are supported.
- Modifying the user's album collection status from this screen.
- Quantity-aware display (the friend having `(x2)` copies does not affect the result).

---

## Phased Rollout Plan

**Phase 1 — This PRD:**
- Unified inline screen with live comparison and CromoCard result.
- Replaces the current two-view state machine entirely.
- All 14 existing `TradesScreen` integration tests are rewritten for the new flow.

**Phase 2 — Future:**
- Persist the last-used comparison text across app sessions.
- Comparison history: view past comparisons by friend.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Button presses to see result after paste | 0 |
| Time from paste to result visible | ≤ 500 ms for up to 200 sticker entries |
| Sticker formats from Repetidas share output recognized | 100% |
| `parseTradeList` unit tests passing | 37 / 37 (zero regressions) |
| `TradesScreen` integration tests passing | ≥ 14 (rewritten for new flow) |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Debounce latency perceptible on large pastes (200+ entries) | Low | `useMemo` for parse step; early exit when input is unchanged |
| `ScrollView` + `TextInput` keyboard scroll behavior on mobile | Medium | `keyboardShouldPersistTaps="handled"`, tested on iOS and Android |
| Test rewrite scope (14 tests) blocks delivery | Low | New tests are written as part of the task alongside the feature |
| Parser false positives (short words matching `[A-Za-z]{2,4}\d+`) | Low | `runComparison` silently skips codes not found in the album catalog; no user-visible error |

---

## Architecture Decision Records

- [ADR-001: Unified Inline Comparison with Live CromoCard Result](adrs/adr-001.md) — Selected Approach 1 (single scrollable screen, debounced live comparison, CromoCards) over two-view auto-transition and split-screen layouts.

---

## Open Questions

- Should the "Nenhum código de país encontrado" error disappear automatically once the user continues typing, or remain until valid codes are found?
- For the CromoCard `state` prop in the result grid, should cards be rendered as `'missing'` (grey) or a neutral "to-request" visual to distinguish from the user's own missing cards?
