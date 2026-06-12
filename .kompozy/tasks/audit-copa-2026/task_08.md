---
status: completed
title: "F5b — accountDeletionService + authStore.pendingDeletion"
type: backend
complexity: medium
dependencies:
    - task_07
---

# Task 8: F5b — accountDeletionService + authStore.pendingDeletion

## Overview

Implementa o serviço TypeScript para CRUD em `account_deletion_requests` e adiciona o campo `pendingDeletion` ao `authStore`. O serviço é consumido pela UI de exclusão (task_09) e pela lógica de bootstrap do `CatalogProvider` que verifica se o usuário tem uma exclusão pendente ao fazer login.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F5 — Service Interface" for the exact TypeScript interface and method signatures
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `src/modules/auth/services/accountDeletionService.ts` with methods: `requestDeletion(userId, userEmail)`, `cancelDeletion(userId)`, `getPendingRequest(userId)`
- MUST add `pendingDeletion: DeletionRequest | null` and `setPendingDeletion(req)` to `authStore.ts`
- MUST export `DeletionRequest` interface from `accountDeletionService.ts`
- MUST implement `requestDeletion`: inserts row with `scheduled_delete_at = NOW() + 30 days`, then calls `supabase.functions.invoke('send-deletion-confirmation', { body: { email, userName, scheduledDeleteAt } })`
- MUST implement `cancelDeletion`: updates row setting `cancelled_at = NOW()`
- MUST implement `getPendingRequest`: selects the latest non-cancelled, non-completed row for userId
- MUST update `CatalogProvider`'s `handleUserLogin` to call `getPendingRequest` after login and populate `authStore.pendingDeletion`
- SHOULD handle the case where `getPendingRequest` returns a row with `scheduled_delete_at < NOW()` and `completed_at IS NULL` — sign the user out (Edge Function delayed) and show a message
</requirements>

## Subtasks

- [ ] 8.1 Create `src/modules/auth/services/accountDeletionService.ts` with `DeletionRequest` interface and all three methods
- [ ] 8.2 Add `pendingDeletion` and `setPendingDeletion` to `src/modules/auth/store/authStore.ts`
- [ ] 8.3 Update `src/core/providers/CatalogProvider.tsx` `handleUserLogin` to call `getPendingRequest` and set `authStore.pendingDeletion`

## Implementation Details

See TechSpec section "Phase 2 — F5 — Service Interface" for the TypeScript interface definition and method contracts.

The Edge Function call in `requestDeletion` is non-blocking for LGPD compliance — if the email send fails, the deletion request is still created. Use try/catch around the `functions.invoke` call and log a warning on failure.

`getPendingRequest` should return `null` if no row exists or if the latest row has `cancelled_at IS NOT NULL`.

### Relevant Files

- `src/modules/auth/services/accountDeletionService.ts` — new file
- `src/modules/auth/store/authStore.ts` — add pendingDeletion field
- `src/core/providers/CatalogProvider.tsx` — call getPendingRequest in handleUserLogin
- `src/shared/services/supabase.ts` — used for DB queries and Edge Function invocation

### Dependent Files

- `task_09` (deletion UI) — imports `accountDeletionService` to call `requestDeletion` and `cancelDeletion`
- `task_10` (Edge Functions) — the `send-deletion-confirmation` function must exist for `requestDeletion` to call it; can be stubbed until task_10 is complete
- `task_14` (ProfileModal) — reads `authStore.pendingDeletion` to show/hide the deletion button state

### Related ADRs

- [ADR-002: Dedicated Table for Account Deletion State](adrs/adr-002.md) — service methods map directly to the table schema
- [ADR-003: Supabase Edge Function + Resend](adrs/adr-003.md) — `requestDeletion` calls the Edge Function; failure is non-blocking

## Deliverables

- `src/modules/auth/services/accountDeletionService.ts` with all three methods and `DeletionRequest` interface
- `src/modules/auth/store/authStore.ts` with `pendingDeletion` field
- `src/core/providers/CatalogProvider.tsx` updated to populate `pendingDeletion` on login
- Unit tests with mocked Supabase

## Tests

- Unit tests:
  - [ ] `requestDeletion` with valid userId and email calls `supabase.from('account_deletion_requests').insert` with `scheduled_delete_at` = approx 30 days from now
  - [ ] `requestDeletion` calls `supabase.functions.invoke('send-deletion-confirmation')` with email, userName, and scheduledDeleteAt
  - [ ] `requestDeletion` does NOT throw when `supabase.functions.invoke` returns an error (non-blocking)
  - [ ] `cancelDeletion` calls `supabase.from('account_deletion_requests').update` with `cancelled_at` set
  - [ ] `getPendingRequest` with no matching row returns `null`
  - [ ] `getPendingRequest` with a cancelled row (cancelled_at IS NOT NULL) returns `null`
  - [ ] `getPendingRequest` with an active pending row returns the `DeletionRequest` object
  - [ ] `authStore.setPendingDeletion(request)` updates `pendingDeletion` in the store
- Integration tests:
  - [ ] Full flow: `requestDeletion` → `getPendingRequest` returns the same row → `cancelDeletion` → `getPendingRequest` returns null
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- TypeScript strict: no `any` types in the new service
- `accountDeletionService` methods type-check correctly against `DeletionRequest` interface
