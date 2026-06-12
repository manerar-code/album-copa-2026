---
status: completed
title: "Fix syncService memory leak + isFlushing concurrency guard"
type: bugfix
complexity: medium
dependencies: []
---

# Fix syncService memory leak + isFlushing concurrency guard


## Overview

`syncService.start()` ignores calls when `currentUserId` is already set, meaning if the service is restarted (user switches accounts), the old NetInfo listener remains active with the stale `userId` in its closure. Additionally, rapid NetInfo reconnection events can trigger multiple concurrent `tryFlush()` calls, causing duplicate DELETE operations and inflated sync counts. This task adds `stop()`-before-`start()` and an `isFlushing` flag.

<critical>
- ALWAYS READ the PRD (F2.8) and TechSpec "Core Interfaces — F2.8" section before starting
- REFERENCE TECHSPEC for the isFlushing flag placement and stop-before-start pattern
- FOCUS ON "WHAT" — prevent duplicate listeners and concurrent flushes
- MINIMIZE CODE — two additions: one guard in start(), one flag in tryFlush()
- TESTS REQUIRED — test concurrent flush and restart scenarios
</critical>

<requirements>
1. `syncService.start(userId)` MUST call `stop()` first if `currentUserId` is already set (not just return early).
2. `tryFlush` MUST check an `isFlushing` boolean flag at entry and return immediately if `true`.
3. `isFlushing` MUST be set to `true` before the flush begins and reset to `false` in a `finally` block.
4. `stop()` MUST reset `isFlushing` to `false` when called.
5. The normal flush path (online, not flushing) MUST be unchanged.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 11.1 Add `let isFlushing = false` to the `createSyncService` closure
- [ ] 11.2 Add `if (isFlushing || !currentUserId) return;` at the start of `tryFlush`
- [ ] 11.3 Wrap `tryFlush` body in `isFlushing = true` / `finally { isFlushing = false }`
- [ ] 11.4 Change `start()` to call `stop()` when `currentUserId` is already set (remove early return)
- [ ] 11.5 Add `isFlushing = false` to the `stop()` body

## Implementation Details

Modify `src/shared/services/syncService.ts` only. See TechSpec "Core Interfaces — F2.8" for the complete closure structure with isFlushing.

### Relevant Files
- `src/shared/services/syncService.ts` — `start`, `stop`, `tryFlush` functions

### Dependent Files
- `src/core/providers/CatalogProvider.tsx` — calls `syncService.start()` and `syncService.stop()` in auth event handlers

## Deliverables

- `syncService.ts` with isFlushing flag and stop-before-start
- Unit tests for concurrent and restart scenarios

## Tests

### Unit Tests
- [ ] `tryFlush` called twice concurrently: `offlineQueueService.flush` called exactly once
- [ ] `tryFlush` called after `stop()`: returns immediately (`isFlushing` is false, `currentUserId` is null)
- [ ] `start(userId1)` then `start(userId2)` without `stop()`: previous listener unsubscribed, new listener registered with `userId2`
- [ ] `stop()` resets `isFlushing` to `false` even if called during an active flush

### Integration Tests
- [ ] Toggling airplane mode rapidly (3 times in 2 seconds) triggers exactly one flush per reconnection event

## Success Criteria

- All tests passing
- Test coverage >= 80% for tryFlush concurrency and start/stop lifecycle
- No duplicate DELETE operations in cloud during rapid reconnection
- No memory leak when user switches accounts
