# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_02 (checkbox label+border in TypeSettingsModal) completed — 10 tests passing
- task_03 (locked FIXED_TYPES section) touches the same file and depends on task_02
- task_06 (album delete via Alert.alert) completed — 19 tests passing
- task_07 (save button visibility+functionality) completed — 11 tests passing, lint clean
- task_09 (cross-album duplicate signaling+confirmation) completed — 31 tests passing (16 store + 9 StickerCard + 6 existing), lint clean

## Shared Decisions

- `setStatus` in `stickerStore.ts` now accepts a third parameter `targetAlbumId?: string`. When set to a different album, it updates `allCollections[targetAlbumId]` and persists to cloud only (no local storage save for non-active albums).

## Shared Learnings

- When testing Zustand store selectors, use `renderHook(() => useStickerStore())` and set initial state via `useStickerStore.setState()` in `beforeEach`. Selectors are called as `result.current.methodName(args)` and computed from the current state.
- To test Alert.alert button callbacks in integration tests: use `jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { capturedButtons = buttons })`, then find button by `text` and call `.onPress!()`. See `StickerCard.test.tsx` for the pattern.

- Test `Alert.alert` confirmations by using `jest.spyOn(Alert, 'alert')` to capture button callbacks (`buttons.find(b => b.style === 'destructive')`), then manually call `.onPress()` to simulate user confirmation — used by task_06, reusable for task_07

- Testing async loading states (ActivityIndicator/disabled button): use `mockImplementation` returning a controllable Promise, then `resolvePromise` inside `act()` — used by task_07, reusable for any loading-state test

- Testing KeyboardAvoidingView wrapper: use `UNSAFE_getByType(KeyboardAvoidingView)` from RNTL to verify behavior prop — reusable for modal layout tests

- Testing components that import `stickerStore` requires mocking: `@shared/services/supabase`, `collectionService`, `cloudCollectionService`, and `offlineQueueService` — these are transitive imports pulled in by `stickerStore.ts`
- Use `useStickerStore.setState()` and `useUserSettingsStore.setState()` in `beforeEach` to control Zustand state for component tests (same pattern as `CatalogProvider.test.tsx`)
- After the `3cf3cfc` dark redesign, `colors.white` and `colors.textPrimary` both resolve to `#EEF2F8`, causing text to be invisible on card/sheet backgrounds that use `backgroundColor: colors.white`. Input text now uses `colors.primary` (#0C1322) for contrast. Profile card bg and sheet bg may need to be changed to a dark surface color for proper dark theme consistency.

## Open Risks

- Profile card (`RootNavigator.tsx`) and album modal sheet (`UserAlbumsModal.tsx`) use `backgroundColor: colors.white` (#EEF2F8), while all text tokens are light (#EEF2F8, #9AA6BE, #646F88). Only `colors.primary` (#0C1322) provides sufficient contrast. If the card/sheet backgrounds are not changed to dark surfaces, text styling for other elements (profileName, profileEmail) may still have contrast issues.

## Handoffs

- task_03 reuses the same mock setup and test infrastructure from task_02
- task_05 and task_07 edit the same files as task_04 (UserAlbumsModal.tsx and RootNavigator.tsx respectively) — ensure text color and placeholder changes are preserved during merge
