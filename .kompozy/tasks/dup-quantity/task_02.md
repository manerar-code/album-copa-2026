---
status: completed
title: Add `quantities` slice and actions to `stickerStore`
type: frontend
complexity: medium
dependencies:
  - task_01
---

# Task 02: Add `quantities` slice and actions to `stickerStore`

## Overview

Extends `stickerStore` with a `quantities: Record<string, number>` state slice and four new
actions: `incrementDupCount`, `resetSticker`, `getDupCount`, and the load/persist integration.
Also modifies `toggleSticker` to branch when the current status is already `duplicate` —
incrementing the count instead of cycling to `missing`. This is the core data layer for the
entire feature.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Core Interfaces" and "System Architecture" sections for exact signatures
- FOCUS ON "WHAT" — add the quantities slice without changing UserCollection or StickerStatus
- MINIMIZE CODE — modify only what is necessary inside stickerStore; do not touch collectionService
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `quantities: Record<string, number>` to the store state (active album quantities)
- MUST add `incrementDupCount(figurinhaId)` — increments quantity by 1 and persists
- MUST add `resetSticker(figurinhaId)` — sets status to `missing` AND removes entry from quantities
- MUST add `getDupCount(figurinhaId): number` — returns stored quantity or 1 if absent
- MUST modify `toggleSticker` so that when `collection[id] === 'duplicate'`, it calls `incrementDupCount` instead of cycling to `missing`
- MUST load quantities alongside collection in `loadCollection` (same async call, no separate trigger)
- MUST persist quantities via `quantitiesService` using the same optimistic-update pattern as collection
- MUST NOT change `UserCollection` type or `StickerStatus` type
- SHOULD reset quantities for a sticker when `resetSticker` transitions it back to `missing`
</requirements>

## Subtasks

- [ ] 2.1 Add `quantities` field to the store state interface and initialise to `{}`
- [ ] 2.2 Implement `getDupCount` — returns `quantities[id] ?? 1`
- [ ] 2.3 Implement `incrementDupCount` — optimistic update + `quantitiesService.save`
- [ ] 2.4 Implement `resetSticker` — set status `missing` + remove from quantities + persist both
- [ ] 2.5 Modify `toggleSticker` branch: if current status is `duplicate`, call `incrementDupCount` and return early
- [ ] 2.6 Load quantities in `loadCollection` alongside existing `collectionService.load`
- [ ] 2.7 Write unit tests covering all new actions and the modified `toggleSticker` branch

## Implementation Details

File to modify: `src/modules/album/store/stickerStore.ts`

Load `quantitiesService` from task_01. Add to the store's initial state. Load both
`collection` and `quantities` in the same `loadCollection` call to prevent a render where
quantities are undefined. Follow the existing optimistic-update + local-persist + background-
cloud-sync pattern already used by `toggleSticker` and `setStatus`.

See TechSpec "Core Interfaces" section for the exact method signatures and the `toggleSticker`
conceptual diff.

### Relevant Files

- `src/modules/album/store/stickerStore.ts` — file to modify
- `src/shared/services/quantitiesService.ts` — task_01 output; import here
- `src/shared/services/collectionService.ts` — reference for optimistic-update pattern
- `src/shared/types/index.ts` — read-only; no changes

### Dependent Files

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — task_04 will call `getDupCount`
- `src/modules/album/components/StickerCard.tsx` — task_05 will call `resetSticker`
- `src/tests/unit/stickerStore.test.ts` — extend with new action tests

### Related ADRs

- [ADR-002: Separate Quantities Store](adrs/adr-002.md) — Mandates parallel slice; no changes to UserCollection
- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Defines the `toggleSticker` branch behaviour

## Deliverables

- Modified `src/modules/album/store/stickerStore.ts`
- Extended `src/tests/unit/stickerStore.test.ts`
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `toggleSticker` on a sticker with status `duplicate` increments `getDupCount` from 1 to 2 (does NOT cycle to `missing`)
  - [ ] `toggleSticker` called three consecutive times on a `duplicate` sticker: status stays `duplicate`, `getDupCount` returns 3
  - [ ] `toggleSticker` still cycles `missing → owned → duplicate` for the first two taps (existing behaviour unchanged)
  - [ ] `resetSticker('fig-007')` sets `collection['fig-007']` to `missing` and removes it from `quantities`
  - [ ] `getDupCount('fig-007')` returns 1 when `fig-007` is absent from `quantities`
  - [ ] `getDupCount('fig-007')` returns 3 after three increment taps
  - [ ] `incrementDupCount` calls `quantitiesService.save` exactly once per invocation
  - [ ] Loading a collection with no matching quantities key results in all `getDupCount` returning 1
- Integration tests:
  - [ ] After `loadCollection('album-1')`, both `collection` and `quantities` reflect stored values
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Existing `toggleSticker` tests for `missing → owned → duplicate` still pass without modification
- `UserCollection` and `StickerStatus` types remain unchanged
- `getDupCount` never returns 0 or undefined
