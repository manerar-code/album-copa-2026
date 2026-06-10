---
status: completed
title: "Add offline fallback to catalogService"
type: bugfix
complexity: medium
dependencies: []
---

# Add offline fallback to catalogService


## Overview

`catalogService.fetchAndCacheFullCatalog()` calls `getAlbum()` directly without a network fallback — if the device is offline on first use after a fresh install, the entire bootstrap throws and the app fails to load. `checkVersion()` also throws on network error instead of returning `null`. Users with a cached catalog must be able to launch the app in airplane mode. This task adds try/catch with `loadCacheLocally()` fallback to both methods.

<critical>
- ALWAYS READ the PRD (F2.5) and TechSpec "Phase 2, step 11" section before starting
- FOCUS ON "WHAT" — return cached data when network is unavailable; never throw when cache exists
- MINIMIZE CODE — wrap existing fetch calls in try/catch with cache fallback
- TESTS REQUIRED — test offline launch with cached and empty cache scenarios
</critical>

<requirements>
1. `fetchAndCacheFullCatalog` MUST catch network errors and call `loadCacheLocally()` as fallback.
2. If `loadCacheLocally()` returns `null` (no cache) AND network is unavailable, MUST throw with message `'No catalog available'`.
3. `checkVersion` MUST return `null` (not throw) when network is unavailable.
4. The normal online path MUST be unchanged — fetch, cache, return.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 9.1 Wrap `getAlbum()` call in `fetchAndCacheFullCatalog` in try/catch
- [ ] 9.2 In catch block, call `loadCacheLocally()` and return if non-null
- [ ] 9.3 In catch block, throw `'No catalog available'` if cache is also null
- [ ] 9.4 Wrap `checkVersion` Supabase query in try/catch, return `null` on network error
- [ ] 9.5 Verify the `initializeCatalog` flow in `CatalogProvider` handles the null version return correctly

## Implementation Details

Modify `src/modules/album/services/catalogService.ts` only. See TechSpec "Phase 2, step 11" for the fallback pattern.

### Relevant Files
- `src/modules/album/services/catalogService.ts` — `fetchAndCacheFullCatalog` and `checkVersion` methods
- `src/core/providers/CatalogProvider.tsx` — calls both methods; error display via `setError` state

### Dependent Files
- `CatalogProvider.tsx` `initializeCatalog` — consumes `checkVersion` return value; must handle `null` correctly (already does per existing code)

## Deliverables

- `catalogService.ts` with offline fallback on both methods
- Unit tests for offline scenarios

## Tests

### Unit Tests
- [ ] `fetchAndCacheFullCatalog` with network error + valid cache: returns cached data without throwing
- [ ] `fetchAndCacheFullCatalog` with network error + null cache: throws `'No catalog available'`
- [ ] `fetchAndCacheFullCatalog` online: normal flow unchanged (fetches, caches, returns)
- [ ] `checkVersion` with network error: returns `null` instead of throwing
- [ ] `checkVersion` online: returns the remote version number

### Integration Tests
- [ ] App launched in airplane mode with cached catalog: Home screen renders correctly
- [ ] App launched in airplane mode without any cached catalog: error screen shown (not crash)

## Success Criteria

- All tests passing
- Test coverage >= 80% for offline paths in catalogService
- App launches successfully in airplane mode when catalog is cached
- Offline launch success rate: 100% when catalog previously cached
