---
status: completed
title: "Fix cloudCollectionService.replaceAll insert error propagation"
type: bugfix
complexity: low
dependencies: []
---

# Fix cloudCollectionService.replaceAll insert error propagation


## Overview

`cloudCollectionService.replaceAll` deletes all rows for a user album then inserts new rows, but discards the Supabase insert result. If the insert fails (transient network error, RLS policy, quota), the collection is silently left empty in the cloud with no error surfaced to the caller. This task adds the missing error check so callers can handle the failure appropriately.

<critical>
- ALWAYS READ the PRD (F2.7) and TechSpec ADR-004 + "Core Interfaces — F2.7" section before starting
- REFERENCE TECHSPEC for the exact one-line fix pattern
- FOCUS ON "WHAT" — propagate insert errors to callers
- MINIMIZE CODE — one destructured assignment + one if-check
- TESTS REQUIRED — test insert failure path
</critical>

<requirements>
1. The Supabase insert call MUST be destructured to capture `{ error }`.
2. If `error` is non-null, MUST throw it so the outer `handleError` catch block receives it.
3. The delete step and the rows mapping logic MUST remain unchanged.
4. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 10.1 Destructure the insert result: `const { error } = await supabase.from(...).insert(rows)`
- [ ] 10.2 Add `if (error) throw error;` immediately after
- [ ] 10.3 Verify the outer try/catch still calls `handleError` and re-throws

## Implementation Details

Modify `src/shared/services/cloudCollectionService.ts` `replaceAll` method only. See TechSpec ADR-004 and "Core Interfaces — F2.7" for the exact change.

### Relevant Files
- `src/shared/services/cloudCollectionService.ts` — `replaceAll` method (lines 51-69)

### Dependent Files
- `src/modules/album/store/stickerStore.ts` — calls `replaceAll` in `resetCollection`; will now receive errors that were previously silent
- `src/core/providers/CatalogProvider.tsx` — calls `replaceAll` via `handleUserLogin`

### Related ADRs
- [ADR-004: cloudCollectionService.replaceAll — Check Insert Error and Throw](adrs/adr-004.md) — Defines the error propagation approach and why upsert was rejected

## Deliverables

- `cloudCollectionService.ts` with insert error check
- Unit tests for the failure path

## Tests

### Unit Tests
- [ ] `replaceAll` with successful insert: resolves without error
- [ ] `replaceAll` with Supabase insert returning `{ error: { message: 'insert failed' } }`: throws an error
- [ ] The thrown error passes through `handleError` (error message is preserved)
- [ ] `replaceAll` with empty collection (rows.length === 0): no insert called, resolves cleanly

### Integration Tests
- [ ] Simulating insert failure during `resetCollection`: caller receives error and can display message

## Success Criteria

- All tests passing
- Test coverage >= 80% for replaceAll error paths
- Data loss from silent insert failure eliminated
