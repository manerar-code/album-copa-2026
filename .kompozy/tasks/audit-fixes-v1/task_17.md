---
status: completed
title: "Add try/catch rollback to stickerStore.resetCollection"
type: bugfix
complexity: low
dependencies: []
---

# Add try/catch rollback to stickerStore.resetCollection


## Overview

`stickerStore.resetCollection` immediately clears local state (`set({ collection: {} })`) before confirming the cloud operation succeeded. If `cloudCollectionService.replaceAll` throws (network error, 401), the local collection is permanently erased with no rollback or user notification. This task adds a snapshot-and-rollback pattern and surfaces the error via an `Alert`.

<critical>
- ALWAYS READ the PRD (F3.2) and TechSpec "Phase 3, step 21" before starting
- FOCUS ON "WHAT" — snapshot before clear, rollback on cloud failure, notify user
- MINIMIZE CODE — capture snapshot before set, wrap cloud call in try/catch
- TESTS REQUIRED — test cloud failure rollback
</critical>

<requirements>
1. `resetCollection` MUST capture `const previousCollection = get().collection` before calling `set({ collection: {} })`.
2. The cloud `replaceAll` call MUST be wrapped in try/catch.
3. On cloud failure, MUST restore local state: `set({ collection: previousCollection })`.
4. On cloud failure, MUST notify the user via `Alert.alert` with a clear error message.
5. `collectionService.reset()` (AsyncStorage clear) MUST also be rolled back on cloud failure.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 17.1 Capture `previousCollection` snapshot before the optimistic clear
- [ ] 17.2 Wrap the cloud `replaceAll` call in try/catch
- [ ] 17.3 On catch: restore `set({ collection: previousCollection })` and re-save to AsyncStorage
- [ ] 17.4 On catch: show `Alert.alert` with error message to user
- [ ] 17.5 Verify the happy path (successful reset) is unchanged

## Implementation Details

Modify `src/modules/album/store/stickerStore.ts` `resetCollection` method only. Use `Alert.alert` from `react-native` (already used in `StickerCard`).

### Relevant Files
- `src/modules/album/store/stickerStore.ts` — `resetCollection` method
- `src/shared/services/cloudCollectionService.ts` — `replaceAll` (now throws on error after task_10)

### Dependent Files
- Any UI component that calls `resetCollection` — will now show error alert on failure

## Deliverables

- `stickerStore.ts` with rollback in `resetCollection`
- Unit tests for cloud failure path

## Tests

### Unit Tests
- [ ] `resetCollection` with successful cloud call: `collection` is `{}`, `collectionService.reset()` called
- [ ] `resetCollection` with cloud `replaceAll` throwing: `collection` restored to `previousCollection`
- [ ] `resetCollection` with cloud failure: `Alert.alert` called with error message
- [ ] `resetCollection` with cloud failure: `collectionService.save(previousCollection)` called to restore AsyncStorage

### Integration Tests
- [ ] Simulating network error during reset: user sees error alert and collection is preserved

## Success Criteria

- All tests passing
- Test coverage >= 80% for resetCollection error path
- No data loss on cloud failure during collection reset
