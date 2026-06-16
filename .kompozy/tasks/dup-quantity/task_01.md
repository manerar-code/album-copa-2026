---
status: completed
title: Create `quantitiesService` for AsyncStorage CRUD
type: frontend
complexity: low
dependencies: []
---

# Task 01: Create `quantitiesService` for AsyncStorage CRUD

## Overview

Creates `src/shared/services/quantitiesService.ts`, a new service that persists duplicate
sticker quantities to AsyncStorage under a per-album key `user_quantities_<albumId>`. This
service is the storage layer for the `quantities` slice added in task_02 and must exist before
the store can be modified.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Data Models" and "Core Interfaces" sections for interface shape
- FOCUS ON "WHAT" — mirror `collectionService` structure exactly; no novel abstractions
- MINIMIZE CODE — three methods: save, load, reset
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST expose `save(quantities: Record<string, number>, userAlbumId: string): Promise<void>`
- MUST expose `load(userAlbumId: string): Promise<Record<string, number>>` returning `{}` when key absent
- MUST expose `reset(userAlbumId: string): Promise<void>`
- MUST use key pattern `user_quantities_<userAlbumId>` (matches collectionService convention)
- MUST use the same `handleError` utility used by `collectionService`
- MUST NOT import from `stickerStore` or any module-level store (no circular deps)
</requirements>

## Subtasks

- [x] 1.1 Create `src/shared/services/quantitiesService.ts` mirroring `collectionService` shape
- [x] 1.2 Implement `save` — JSON.stringify and AsyncStorage.setItem
- [x] 1.3 Implement `load` — AsyncStorage.getItem, JSON.parse, default to `{}`
- [x] 1.4 Implement `reset` — AsyncStorage.removeItem
- [x] 1.5 Write unit tests covering all three methods and the absent-key default

## Implementation Details

Create `src/shared/services/quantitiesService.ts`. Follow the exact same structure as
`src/shared/services/collectionService.ts` — same error handling pattern (`handleError`),
same try/catch shape, same default return on missing key.

AsyncStorage key: `` `user_quantities_${userAlbumId}` ``

See TechSpec "Data Models" section for the stored JSON shape.

### Relevant Files

- `src/shared/services/collectionService.ts` — canonical pattern to mirror
- `src/shared/utils/handleError.ts` (or equivalent) — error utility to reuse
- `src/shared/types/index.ts` — no type changes needed; `Record<string, number>` is sufficient

### Dependent Files

- `src/modules/album/store/stickerStore.ts` — task_02 will import `quantitiesService`
- `src/tests/unit/stickerStore.test.ts` — task_02 tests will mock `quantitiesService`

### Related ADRs

- [ADR-002: Separate Quantities Store](adrs/adr-002.md) — Justifies creating a parallel service rather than extending collectionService

## Deliverables

- `src/shared/services/quantitiesService.ts` (new file)
- `src/tests/unit/quantitiesService.test.ts` (new file)
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `save` writes correct JSON string to AsyncStorage under key `user_quantities_album-1`
  - [ ] `load` returns parsed object `{ "fig-007": 2 }` when key exists
  - [ ] `load` returns `{}` when AsyncStorage key is absent (no entry yet)
  - [ ] `reset` calls `AsyncStorage.removeItem` with the correct scoped key
  - [ ] `save` followed by `load` round-trips the same object
- Integration tests:
  - [ ] (covered by task_02 integration tests — no standalone integration test needed here)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `quantitiesService` can be imported and called without side effects
- No imports from store modules (service layer stays free of store dependencies)
