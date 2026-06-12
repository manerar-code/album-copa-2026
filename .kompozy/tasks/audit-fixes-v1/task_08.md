---
status: completed
title: "Fix toggleSticker stale rollback + add 300ms debounce"
type: bugfix
complexity: medium
dependencies: []
---

# Fix toggleSticker stale rollback + add 300ms debounce


## Overview

`stickerStore.toggleSticker` captures `collection` at the start of the function and uses it in the `catch` rollback block. On a rapid double-tap, the second call's rollback uses the stale pre-first-tap collection, potentially overwriting a successfully committed first update with incorrect state. Additionally, without debounce, two concurrent toggle calls can race against each other causing data loss. This task fixes the rollback to snapshot state correctly and adds a 300ms debounce to the tap handler.

<critical>
- ALWAYS READ the PRD (F2.4) and TechSpec "Core Interfaces — F2.4" section before starting
- REFERENCE TECHSPEC for the snapshot variable naming and debounce placement
- FOCUS ON "WHAT" — use a pre-toggle snapshot for rollback, debounce the tap handler
- MINIMIZE CODE — two targeted changes: rollback variable rename + debounce
- TESTS REQUIRED — test double-tap and rollback scenarios
</critical>

<requirements>
1. `toggleSticker` MUST capture `const previousCollection = get().collection` as a named snapshot BEFORE the optimistic state update.
2. The `catch` rollback MUST use `previousCollection` (the pre-toggle snapshot), not the destructured `collection` from the outer scope.
3. A 300ms debounce MUST be added to the sticker card tap handler in `StickerCard.tsx` to prevent double-tap racing.
4. The debounce MUST NOT delay the optimistic UI update — only the async persistence call.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 8.1 Rename the rollback variable in `toggleSticker` to `previousCollection = get().collection` captured before the optimistic update
- [ ] 8.2 Update the `catch` block to use `set({ collection: previousCollection })`
- [ ] 8.3 Add a 300ms debounce ref to `StickerCard.tsx` tap handler
- [ ] 8.4 Verify the optimistic UI update still happens immediately (no visible delay to user)
- [ ] 8.5 Verify rapid double-tap does not produce inconsistent collection state

## Implementation Details

Two files: `src/modules/album/store/stickerStore.ts` (rollback fix) and `src/modules/album/components/StickerCard.tsx` (debounce). See TechSpec "Core Interfaces — F2.4" for the correct snapshot pattern.

### Relevant Files
- `src/modules/album/store/stickerStore.ts` — `toggleSticker` method rollback variable
- `src/modules/album/components/StickerCard.tsx` — tap handler debounce

### Dependent Files
- Any screen rendering `StickerCard` inherits debounce behavior automatically

## Deliverables

- `stickerStore.ts` with correct rollback snapshot
- `StickerCard.tsx` with 300ms debounce on tap handler
- Unit tests for rollback and double-tap scenarios

## Tests

### Unit Tests
- [ ] `toggleSticker` with a successful persist: collection is updated to the new status
- [ ] `toggleSticker` with `upsertOne` throwing: collection is rolled back to the state BEFORE the toggle (not a stale earlier state)
- [ ] Rapid double-tap on the same sticker: second tap is ignored within 300ms window
- [ ] Rapid double-tap with 400ms gap: both taps are processed correctly

### Integration Tests
- [ ] Marking a sticker owned on web and immediately tapping again shows the correct status after 300ms
- [ ] Simulating a network error during toggle restores the correct prior state

## Success Criteria

- All tests passing
- Test coverage >= 80% for toggleSticker rollback path
- Double-tap does not produce incorrect sticker state
- No data loss reports after 5-day TestFlight soak period
