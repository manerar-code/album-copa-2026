---
status: completed
title: "Replace getSession with getUser in authService + 401 handling"
type: bugfix
complexity: medium
dependencies: []
---

# Replace getSession with getUser in authService + 401 handling


## Overview

`authService.getCurrentUser()` uses `supabase.auth.getSession()` which reads the local AsyncStorage cache without server-side token validation. After a long offline period, the cached token may be expired — `getSession()` returns it as valid, but all subsequent API calls return 401. The user appears logged in but all cloud operations fail silently. Replacing with `supabase.auth.getUser()` validates the token server-side. Additionally, `cloudCollectionService` must detect 401 responses and trigger automatic sign-out.

<critical>
- ALWAYS READ the PRD (F2.6) and TechSpec "Phase 2, step 14" and "API Endpoints — authService.getCurrentUser" sections before starting
- FOCUS ON "WHAT" — use server-validated session; sign out automatically on 401
- MINIMIZE CODE — replace one method call + add 401 check in cloudCollectionService
- TESTS REQUIRED — test expired session and 401 handling
</critical>

<requirements>
1. `authService.getCurrentUser()` MUST call `supabase.auth.getUser()` instead of `supabase.auth.getSession()`.
2. The return type and shape of `AppUser` MUST remain identical.
3. `cloudCollectionService` MUST detect Supabase 401 errors and call `supabase.auth.signOut()` + clear auth store when detected.
4. After automatic sign-out, the `onAuthStateChange` listener in `CatalogProvider` MUST handle the `SIGNED_OUT` event (already implemented — verify it fires).
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 12.1 Replace `supabase.auth.getSession()` with `supabase.auth.getUser()` in `authService.ts`
- [ ] 12.2 Update the user mapping to use `data.user` from `getUser()` response
- [ ] 12.3 Add 401 detection in `cloudCollectionService` error handler
- [ ] 12.4 On 401 detection, call `supabase.auth.signOut()` and clear `useAuthStore`
- [ ] 12.5 Verify `CatalogProvider` `SIGNED_OUT` event handler clears all store state

## Implementation Details

Modify `src/modules/auth/services/authService.ts` and `src/shared/services/cloudCollectionService.ts`. See TechSpec "API Endpoints" section for the `getUser()` vs `getSession()` difference and 401 handling pattern.

### Relevant Files
- `src/modules/auth/services/authService.ts` — `getCurrentUser` method
- `src/shared/services/cloudCollectionService.ts` — error handler (import supabase + authStore)
- `src/core/providers/CatalogProvider.tsx` — `SIGNED_OUT` event handler (verify, no change needed)

### Dependent Files
- `src/core/providers/CatalogProvider.tsx` — `bootstrap` calls `getCurrentUser`; behavior unchanged for valid sessions
- `task_13` (Sign in with Apple) — depends on stable `authService.ts`

### Related ADRs
- [ADR-003: Sign in with Apple](adrs/adr-003.md) — shares `authService.ts`; complete task_12 first

## Deliverables

- `authService.ts` using `getUser()` for session validation
- `cloudCollectionService.ts` with automatic sign-out on 401
- Unit tests for expired session and 401 scenarios

## Tests

### Unit Tests
- [ ] `getCurrentUser()` with valid session: returns `AppUser` with correct id/email/name
- [ ] `getCurrentUser()` with expired token: `getUser()` returns error, method returns `null`
- [ ] `getCurrentUser()` with no session: returns `null`
- [ ] `cloudCollectionService` method receiving 401 error: calls `supabase.auth.signOut()`
- [ ] `cloudCollectionService` method receiving non-401 error: does NOT call `signOut()`

### Integration Tests
- [ ] Session invalidated via Supabase dashboard → next cloud operation triggers sign-out → login screen appears

## Success Criteria

- All tests passing
- Test coverage >= 80% for session validation and 401 handling
- Zero silent 401 failures after implementation
- Automatic sign-out triggers login screen correctly
