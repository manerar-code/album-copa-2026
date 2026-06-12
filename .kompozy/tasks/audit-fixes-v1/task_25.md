---
status: completed
title: "Add pre-init warning guard to offlineQueueService.enqueue"
type: bugfix
complexity: low
dependencies: []
---

# Add pre-init warning guard to offlineQueueService.enqueue


## Overview

`offlineQueueService.enqueue` silently returns `undefined` when called before `init()` has been called (i.e., when `db === null`). This means offline operations can be silently lost with no indication to the developer that the queue was not initialized. Adding a `logger.warn` call when `db === null` makes the failure visible during development and debugging.

<critical>
- ALWAYS READ the PRD (F3.10) and TechSpec "Phase 3, step 29" before starting
- FOCUS ON "WHAT" — add a logger.warn guard when db is null in enqueue
- MINIMIZE CODE — one guard condition + one log call
- TESTS REQUIRED — verify warn is called when db is null and not called when initialized
</critical>

<requirements>
1. `enqueue` MUST call `logger.warn('offlineQueueService.enqueue called before init()')` when `db === null`.
2. `enqueue` MUST return early after the warning (do not attempt the operation).
3. The warning MUST NOT be emitted in production builds — it relies on the `__DEV__` guard already present in `logger.warn` (added in task_14).
4. The normal enqueue path (when `db !== null`) MUST be unchanged.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 25.1 Locate the `if (db === null)` check (or equivalent null check) in `offlineQueueService.enqueue`
- [ ] 25.2 Add `logger.warn('offlineQueueService.enqueue called before init()')` before the early return
- [ ] 25.3 Verify no warn is emitted in the normal initialized flow

## Implementation Details

Modify `src/shared/services/offlineQueueService.ts` only. See TechSpec "Phase 3, step 29" and PRD F3.10.

### Relevant Files
- `src/shared/services/offlineQueueService.ts` — `enqueue` function, `db` null check
- `src/shared/utils/logger.ts` — `warn` method (must have `__DEV__` guard from task_14)

### Dependent Files
- task_14 — `logger.warn` must have `__DEV__` guard already applied before this task runs (or apply simultaneously)

### Related ADRs
- ADR-005 — Logger `__DEV__` guard (applies to all `logger.warn` calls including this new one)

## Deliverables

- `offlineQueueService.ts` with pre-init guard and logger.warn
- Unit test confirming warn is called before init

## Tests

### Unit Tests
- [ ] `enqueue` called before `init()`: `logger.warn` is called with message containing "before init"
- [ ] `enqueue` called before `init()`: function returns without throwing
- [ ] `enqueue` called after `init()`: `logger.warn` is NOT called
- [ ] `enqueue` called after `init()`: item is added to the queue normally

### Integration Tests
- [ ] App startup: `offlineQueueService.init()` is called before any `enqueue` call — no warn emitted during normal flow

## Success Criteria

- All tests passing
- Test coverage >= 80% for enqueue function
- No silent no-ops: pre-init calls produce a visible dev warning
