---
status: completed
title: "F10 — React.memo em StickerCard e CromoCard"
type: refactor
complexity: low
dependencies:
  - task_14
---

# Task 15: F10 — React.memo em StickerCard e CromoCard

## Overview

Envolve `StickerCard` e `CromoCard` com `React.memo` para evitar re-renders desnecessários na grid de figurinhas. Marcar uma figurinha deve re-renderizar apenas o card tocado, não toda a FlatList. Os componentes já usam `useShallow` (StickerCard) e não têm subscriptions de store (CromoCard) — o memo é a camada final de otimização.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 4 — F10 — StickerCard Performance Optimization" for the exact memo pattern and displayName requirement
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST wrap `StickerCard` export with `React.memo`: `export const StickerCard = React.memo(function StickerCard(...) { ... })`
- MUST wrap `CromoCard` export with `React.memo`: `export const CromoCard = React.memo(function CromoCard(...) { ... })`
- MUST add `StickerCard.displayName = 'StickerCard'` after the memo wrap
- MUST add `CromoCard.displayName = 'CromoCard'` after the memo wrap
- MUST NOT change any component behavior, props, or visual output
- SHOULD verify via React DevTools Profiler that tapping one sticker re-renders only that card
</requirements>

## Subtasks

- [x] 15.1 Wrap `StickerCard` with `React.memo` and set `displayName`
- [x] 15.2 Wrap `CromoCard` with `React.memo` and set `displayName`
- [x] 15.3 Run `npm test` to verify no regressions

## Implementation Details

See TechSpec section "Phase 4 — F10 — StickerCard Performance Optimization" for the exact code pattern.

`StickerCard` already uses `useCallback` for `handlePress` in the component body, so the memo comparison of the `onPress`-equivalent prop will work correctly without additional stabilization.

`CromoCard` is a pure presentational component (no store subscriptions) with all primitive or stable props — memo is straightforward.

The memo wrap does not change the import path or the exported name — all existing usages of `StickerCard` and `CromoCard` remain valid without changes.

### Relevant Files

- `src/shared/components/StickerCard.tsx` — add React.memo wrap
- `src/shared/components/CromoCard.tsx` — add React.memo wrap

### Dependent Files

- Any component that renders `StickerCard` or `CromoCard` (no code changes needed — only performance impact)

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Phase 4; runs after ProfileModal extraction (task_14) is stable

## Deliverables

- `StickerCard.tsx` wrapped with `React.memo` and `displayName` set
- `CromoCard.tsx` wrapped with `React.memo` and `displayName` set
- All existing tests still pass

## Tests

- Unit tests:
  - [ ] `StickerCard.displayName` equals `'StickerCard'` (check via component type)
  - [ ] `CromoCard.displayName` equals `'CromoCard'`
  - [ ] Existing StickerCard tests: tapping the card cycles through missing → owned → duplicate → missing states (all existing tests pass unchanged)
  - [ ] Existing CromoCard tests: renders correct border color for owned (green), gradient for duplicate (gold), grey for missing (all existing tests pass unchanged)
- Integration tests:
  - [ ] No re-render of non-tapped StickerCards when one card state changes (verify with React DevTools Profiler — manual)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- `npm run lint` passes with zero errors
- Both components have `displayName` set (verifiable in React DevTools)
- Zero user-visible behavioral or visual changes
