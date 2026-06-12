---
status: completed
title: "F12 — Decomposição do CatalogProvider em 4 hooks"
type: refactor
complexity: high
dependencies:
  - task_14
---

# Task 16: F12 — Decomposição do CatalogProvider em 4 hooks

## Overview

Divide o `CatalogProvider.tsx` (315 linhas, 6 responsabilidades distintas) em 4 hooks customizados focados: `useBootstrap`, `useCatalogLoad`, `useAuthListener` e `useUserLogin`. O `CatalogProvider` se torna um orquestrador fino que chama esses hooks. Cada hook é independentemente testável com `renderHook`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 4 — F12 — CatalogProvider Decomposition" for the exact hook signatures, responsibility mapping, and target structure of the thin provider
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `src/core/providers/hooks/useBootstrap.ts`: encapsulates the auth bootstrap useEffect (authService.getCurrentUser, 8-second timeout, offlineQueueService.init)
- MUST create `src/core/providers/hooks/useCatalogLoad.ts`: encapsulates initializeCatalog + checkForUpdates logic, receives `bootstrapComplete` as input
- MUST create `src/core/providers/hooks/useAuthListener.ts`: encapsulates `supabase.auth.onAuthStateChange` subscription, calls `onSignIn(isNew)` and `onSignOut()` callbacks
- MUST create `src/core/providers/hooks/useUserLogin.ts`: encapsulates handleUserLogin (user-album hydration, silent merge, collection loading) and mergeState orchestration
- MUST update `CatalogProvider.tsx` to call the 4 hooks and reduce to an orchestrator rendering only children, the Loading state, and the MergeDialog
- MUST NOT change any user-visible behavior — bootstrap, catalog load, auth flow, merge dialog, and onboarding must work identically after the refactor
- MUST maintain the existing `OnboardingContext` provider behavior
- Each hook MUST be independently testable with `renderHook` from `@testing-library/react-native`
</requirements>

## Subtasks

- [x] 16.1 Create `useBootstrap.ts` — move bootstrap useEffect and return `{ bootstrapComplete: boolean }`
- [x] 16.2 Create `useCatalogLoad.ts` — move catalog initialization logic and return `{ catalogReady: boolean }`
- [x] 16.3 Create `useAuthListener.ts` — move `onAuthStateChange` subscription; accept `onSignIn` and `onSignOut` callbacks
- [x] 16.4 Create `useUserLogin.ts` — move `handleUserLogin`, `mergeState`, and `handleMergeChoice`
- [x] 16.5 Update `CatalogProvider.tsx` to use the 4 hooks and verify it is a thin orchestrator

## Implementation Details

See TechSpec section "Phase 4 — F12 — CatalogProvider Decomposition" for the hook signatures and the thin-provider pattern.

Execution order matters: `useCatalogLoad` receives `bootstrapComplete` from `useBootstrap` — catalog loading starts only after auth bootstrap is done. This dependency must be preserved.

The onboarding logic (Concern 1 in the TechSpec analysis) is currently implemented via `OnboardingContext`. If it is already in a separate file, it stays there. If it is inline in CatalogProvider, extract it only if it has clear boundaries — do not over-extract.

Each hook must clean up its own subscriptions in the return function of `useEffect`.

### Relevant Files

- `src/core/providers/CatalogProvider.tsx` — modify to become thin orchestrator
- `src/core/providers/hooks/useBootstrap.ts` — new file
- `src/core/providers/hooks/useCatalogLoad.ts` — new file
- `src/core/providers/hooks/useAuthListener.ts` — new file
- `src/core/providers/hooks/useUserLogin.ts` — new file
- `src/modules/auth/services/authService.ts` — called from useBootstrap and useAuthListener
- `src/shared/services/offlineQueueService.ts` — called from useBootstrap

### Dependent Files

- `task_17` (test migration) — depends on all tests passing after this refactor before removing jest-native

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Phase 4; highest-risk refactor

## Deliverables

- `src/core/providers/hooks/useBootstrap.ts`
- `src/core/providers/hooks/useCatalogLoad.ts`
- `src/core/providers/hooks/useAuthListener.ts`
- `src/core/providers/hooks/useUserLogin.ts`
- `CatalogProvider.tsx` updated to thin orchestrator
- Unit tests for each hook using `renderHook`

## Tests

- Unit tests:
  - [x] `useBootstrap`: mock `authService.getCurrentUser` to resolve → `bootstrapComplete` becomes `true`
  - [x] `useBootstrap`: mock `authService.getCurrentUser` to return null → `bootstrapComplete` still becomes `true`
  - [x] `useBootstrap`: `offlineQueueService.init` is called during bootstrap
  - [x] `useCatalogLoad`: with `bootstrapComplete = false` → `initializeCatalog` NOT called
  - [x] `useCatalogLoad`: with `bootstrapComplete = true` → `initializeCatalog` called once
  - [x] `useAuthListener`: mock `supabase.auth.onAuthStateChange` fires `SIGNED_IN` → `onSignIn(true)` called (with different user ref)
  - [x] `useAuthListener`: mock fires `SIGNED_OUT` → `onSignOut()` called
  - [x] `useAuthListener`: subscription is cleaned up when the hook unmounts
  - [x] `useUserLogin`: `handleUserLogin` for a user with no existing collection → no merge dialog shown
  - [x] `useUserLogin`: `handleMergeChoice('local')` → clears `mergeState`
- Integration tests:
  - [ ] Full app bootstrap flow on a fresh launch: loading → catalog loaded → sticker grid visible (smoke test)
  - [ ] Sign in → sticker collection loads → mark a sticker → sticker state persists after navigation (smoke test)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- Zero user-visible behavior changes — existing smoke tests pass
- `CatalogProvider.tsx` under 80 lines (excluding imports)
- Each hook file under 80 lines
