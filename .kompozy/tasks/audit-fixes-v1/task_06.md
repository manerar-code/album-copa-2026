---
status: completed
title: "Refactor CatalogProvider bootstrap with timeout + unified finally"
type: bugfix
complexity: medium
dependencies: []
---

# Refactor CatalogProvider bootstrap with timeout + unified finally


## Overview

The `CatalogProvider` bootstrap sets `authStore.isLoading = true` on entry but only clears it in a `finally` block that covers the auth portion. If `authService.getCurrentUser()` (a Supabase network call) hangs indefinitely on a slow or broken network, `setLoading(false)` is never called and the app renders a permanent loading screen. Additionally, if `initializeCatalog()` throws, `stickerStore.loading` is never reset. This task adds an 8-second `Promise.race` timeout around the auth call and ensures all loading states are cleared in both `finally` blocks.

<critical>
- ALWAYS READ the PRD (F1.4, F2.11) and TechSpec "Core Interfaces — F1.4" section before starting
- REFERENCE TECHSPEC for the exact Promise.race timeout pattern
- FOCUS ON "WHAT" — guarantee loading states are always cleared within 8 seconds
- MINIMIZE CODE — see TechSpec Core Interfaces for the complete bootstrap pattern
- TESTS REQUIRED — test timeout behavior and error scenarios
</critical>

<requirements>
1. A `Promise.race` with an 8-second timeout MUST wrap the `offlineQueueService.init()` + `authService.getCurrentUser()` calls.
2. The timeout promise MUST resolve (not reject) so the `catch` block is not triggered on timeout.
3. `authStore.setLoading(false)` MUST be in a `finally` block that covers the `Promise.race`.
4. The second `try` block (catalog + sync) MUST have a `finally` that calls `store.setLoading(false)`.
5. If the timeout fires before `getCurrentUser()` resolves, the app MUST proceed with `user = null` (unauthenticated).
6. No existing bootstrap behavior MUST change for the normal (non-timeout) path.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] 6.1 Add a `BOOTSTRAP_TIMEOUT_MS = 8000` constant at the top of the bootstrap function
- [x] 6.2 Wrap auth initialization (offlineQueueService + getCurrentUser) in `Promise.race` with timeout
- [x] 6.3 Move `authStore.setLoading(false)` into the `finally` block of the race
- [x] 6.4 Add `store.setLoading(false)` to a `finally` on the second try block (catalog + sync)
- [x] 6.5 Verify the normal path (no timeout) still sets user and starts syncService correctly

## Implementation Details

Modify `src/core/providers/CatalogProvider.tsx` bootstrap function only. See TechSpec "Core Interfaces — F1.4" for the complete implementation pattern including the timeout promise and Promise.race structure.

### Relevant Files
- `src/core/providers/CatalogProvider.tsx` — bootstrap useEffect (lines 172–203)
- `src/modules/auth/store/authStore.ts` — `setLoading` method (called in finally)
- `src/modules/album/store/stickerStore.ts` — `setLoading` method (called in second finally)

### Dependent Files
- Any screen gated on `authStore.isLoading` — will now always receive `false` within 8 seconds

## Deliverables

- `CatalogProvider.tsx` with timeout-safe bootstrap
- Unit tests for timeout and error paths

## Tests

### Unit Tests
- [ ] Bootstrap with `getCurrentUser()` resolving in 2s: user is set, `setLoading(false)` called
- [ ] Bootstrap with `getCurrentUser()` taking > 8s: timeout fires, `user = null`, `setLoading(false)` called
- [ ] Bootstrap with `getCurrentUser()` throwing: error caught, `setLoading(false)` called in finally
- [ ] Bootstrap with `initializeCatalog()` throwing: `store.setLoading(false)` called in second finally
- [ ] Normal path: `syncService.start()` is called when user is non-null after successful auth

### Integration Tests
- [ ] App launches and Home screen renders within 10 seconds even when Supabase is unreachable
- [ ] App does not stay on loading screen indefinitely after Phase 1 build on device

## Success Criteria

- All tests passing
- Test coverage >= 80% for bootstrap timeout and error paths
- App always renders within 8 seconds on iOS regardless of network state
