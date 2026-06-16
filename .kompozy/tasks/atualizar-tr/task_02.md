---
status: completed
title: registerTrade store action
type: frontend
complexity: medium
dependencies: []
---

# Task 02: registerTrade store action

## Overview

Adds `registerTrade(sent: string[], received: string[])` to `stickerStore.ts`. The action applies all sent/received mutations in memory first, persists to AsyncStorage with a single write per service, then syncs changed stickers to the cloud in parallel. It follows the same save-first, sync-later contract as the existing `resetSticker` and `toggleSticker` actions.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "registerTrade Logic" tables and "Core Interfaces" section
- FOCUS ON "WHAT" — a batch mutation action; the sent/received ID lists come pre-resolved from the modal
- MINIMIZE CODE — follow the existing pattern in stickerStore exactly; no new abstractions
- TESTS REQUIRED — unit tests for the mutation logic and an integration test for the save/revert contract
</critical>

<requirements>
- 1. MUST add `registerTrade` to the `CatalogState` interface in `stickerStore.ts`
- 2. MUST apply all mutations in memory before any I/O (optimistic update pattern)
- 3. MUST call `collectionService.save` ONCE and `quantitiesService.save` ONCE (not per sticker)
- 4. MUST revert the full state snapshot on local save failure and return early
- 5. MUST sync changed stickers to cloud via `Promise.all` of `cloudCollectionService.upsertOne` calls, non-reverting on cloud failure
- 6. MUST respect `syncStore.status === 'offline'` check before cloud sync (same as `toggleSticker`)
- 7. MUST skip sent stickers not in `duplicate` status silently (no error, no state change)
- 8. MUST convert `duplicate` with qty=1 to `owned` and remove the qty entry
- 9. MUST decrement qty for `duplicate` with qty≥2
- 10. MUST set received stickers to `owned` regardless of current state (idempotent)
- 11. MUST log completion with `logger.log('registerTrade: completed — X sent, Y received')`
</requirements>

## Subtasks

- [ ] 2.1 Add `registerTrade: (sent: string[], received: string[]) => Promise<void>` to `CatalogState` interface
- [ ] 2.2 Implement the sent-sticker mutation loop (decrement or promote to owned)
- [ ] 2.3 Implement the received-sticker mutation loop (set to owned, remove qty entry)
- [ ] 2.4 Implement save-first block with full state rollback on failure
- [ ] 2.5 Implement background cloud sync block with `Promise.all`
- [ ] 2.6 Write unit tests for decrement/promotion logic in `src/tests/unit/registerTradeLogic.test.ts`
- [ ] 2.7 Write integration test in `src/tests/integration/registerTrade.test.ts`

## Implementation Details

One existing file modified: `src/modules/album/store/stickerStore.ts`

Add the new action at the end of the store, before the helper selectors (`getStatus`, `getStats`, etc.). Follow the structure of `resetSticker` exactly: snapshot previous state, optimistic set, try local save, catch → revert + return, try cloud sync, catch → logger.warn.

See TechSpec "registerTrade Logic" tables for the exact mutation rules per state/qty combination. See TechSpec "Monitoring and Observability" for the required log messages.

### Relevant Files

- `src/modules/album/store/stickerStore.ts` — the only file modified; add action to interface and implementation
- `src/shared/services/collectionService.ts` — `save(collection, userAlbumId)` signature
- `src/shared/services/quantitiesService.ts` — `save(quantities, userAlbumId)` signature
- `src/shared/services/cloudCollectionService.ts` — `upsertOne(userAlbumId, figurinhaId, status, syncUserId)` signature
- `src/shared/store/syncStore.ts` — `useSyncStore.getState().status` for offline check
- `src/shared/utils/logger.ts` — `logger.log`, `logger.warn`, `logger.error`
- `src/tests/integration/` — existing integration test folder

### Dependent Files

- `src/modules/duplicates/components/TradeRegistrationModal.tsx` — (Task 03) calls `useStickerStore().registerTrade`

### Related ADRs

- [ADR-002: registerTrade Batch Action in stickerStore](adrs/adr-002.md) — defines the batch approach and explains why looping setStatus was rejected

## Deliverables

- `src/modules/album/store/stickerStore.ts` — updated with `registerTrade` action and interface entry
- `src/tests/unit/registerTradeLogic.test.ts` — unit tests for mutation logic
- `src/tests/integration/registerTrade.test.ts` — integration test with mocked services

## Tests

- Unit tests:
  - [ ] Sent sticker with `collection[id] = 'duplicate'` and `quantities[id] = 3` → qty becomes 2, status stays `duplicate`
  - [ ] Sent sticker with `collection[id] = 'duplicate'` and no qty entry (default 1) → status becomes `owned`, id removed from quantities
  - [ ] Sent sticker with `collection[id] = 'owned'` → collection unchanged, no throw
  - [ ] Sent sticker with `collection[id] = 'missing'` → collection unchanged, no throw
  - [ ] Received sticker with `collection[id] = 'missing'` → status becomes `owned`
  - [ ] Received sticker with `collection[id] = 'duplicate'` → status becomes `owned`, id removed from quantities
  - [ ] Received sticker with `collection[id] = 'owned'` → no state change (idempotent)
  - [ ] Both sent and received arrays empty → collection and quantities unchanged
- Integration tests:
  - [ ] `registerTrade(['fig-a'], ['fig-b'])` calls `collectionService.save` exactly once and `quantitiesService.save` exactly once
  - [ ] Local save failure: store reverts to pre-trade collection and quantities snapshots
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `collectionService.save` called exactly once per `registerTrade` call regardless of how many stickers are in the lists
- TypeScript strict mode passes with no errors or `any`
- `registerTrade` appears in `CatalogState` interface
