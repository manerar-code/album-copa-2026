# Task Memory: task_16.md

## Objective Snapshot
Decomposed CatalogProvider.tsx (315 lines → 122 lines) into 4 hooks: useBootstrap, useCatalogLoad, useAuthListener, useUserLogin. Each hook <80 lines. Created 35 unit tests covering all hooks.

## Important Decisions
- Zustand store state objects (from `useAuthStore()`, `useStickerStore()`) must NOT be used as useEffect/useCallback deps — they change on every store action, causing infinite effect cleanup/re-run. Use `getState()` inside the async body instead.
- `handleSignOut` in CatalogProvider uses `getState()` instead of hook variables to avoid frequent callback recreation causing auth subscription churn.
- All mocked service implementations must be restored in `beforeEach` (not just `clearAllMocks`) to prevent cross-test leakage.

## Learnings
- `jest.clearAllMocks()` resets call counts but NOT mock implementations — always re-assign default `.mockResolvedValue()` in beforeEach.
- `renderHook` with a constant callback like `() => useHook(false)` cannot be meaningfully rerendered — use `initialProps` pattern.
- Zustand v5 hooks return the full state object (including methods), which changes referentially on every state mutation.

## Files / Surfaces
- `src/core/providers/CatalogProvider.tsx` — thin orchestrator (122 lines, 43 excluding imports/styles)
- `src/core/providers/hooks/useBootstrap.ts` — 46 lines
- `src/core/providers/hooks/useCatalogLoad.ts` — 80 lines
- `src/core/providers/hooks/useAuthListener.ts` — 36 lines
- `src/core/providers/hooks/useUserLogin.ts` — 126 lines
- `src/tests/unit/CatalogProviderHooks.test.tsx` — 35 tests, all passing
- `src/tests/unit/CatalogProvider.test.tsx` — 9 tests, all passing (1 previously failing now fixed)

## Errors / Corrections
- Catalog load hung when Zustand store state changes triggered effect cleanup before `setCatalogReady(true)` — fixed by using `getState()` and removing store/userSettings from deps.
- Same pattern applied to `useAuthListener` (removed `authStore` from deps) and `useUserLogin` (empty deps with `getState()`).

## Ready for Next Run
Task 16 complete. Ready for task_17 (test migration).
