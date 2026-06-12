---
status: completed
title: "Create crossPlatformAlert helper + wrap StickerCard handlePress in useCallback"
type: refactor
complexity: low
dependencies: []
---

# Create crossPlatformAlert helper + wrap StickerCard handlePress in useCallback


## Overview

`StickerCard.handlePress` uses `Alert.alert` directly, which does not work in a web browser. On web, `Alert.alert` is silently no-op'd by React Native Web, so the cross-album confirmation dialog never appears. Additionally, `handlePress` is recreated on every render without `useCallback`, causing unnecessary re-renders of `StickerCard`. This task creates a `crossPlatformAlert` helper and stabilizes the handler reference.

<critical>
- ALWAYS READ the PRD (F3.8) and TechSpec "Phase 3, step 25" before starting
- FOCUS ON "WHAT" — create shared helper, wrap handler in useCallback
- MINIMIZE CODE — one new utility function + one useCallback wrapper
- TESTS REQUIRED — test both web and native alert paths
</critical>

<requirements>
1. A `crossPlatformAlert(title, message, buttons)` helper MUST be created in `src/shared/utils/crossPlatformAlert.ts`.
2. On native (`Platform.OS !== 'web'`), the helper MUST call `Alert.alert`.
3. On web, the helper MUST use `window.confirm` for single-confirm dialogs and fall back to `window.alert` for info-only.
4. `StickerCard.handlePress` MUST be wrapped in `useCallback` with correct dependencies.
5. All existing `Alert.alert` calls in `StickerCard.tsx` MUST use `crossPlatformAlert` instead.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 21.1 Create `src/shared/utils/crossPlatformAlert.ts` with platform-branched implementation
- [ ] 21.2 Replace `Alert.alert` calls in `StickerCard.tsx` with `crossPlatformAlert`
- [ ] 21.3 Wrap `handlePress` (both variants) in `useCallback` with correct dependency array
- [ ] 21.4 Verify the cross-album confirmation dialog appears on web when triggered

## Implementation Details

New file: `src/shared/utils/crossPlatformAlert.ts`. Modify `src/modules/album/components/StickerCard.tsx`. See TechSpec "Phase 3, step 25".

### Relevant Files
- `src/shared/utils/crossPlatformAlert.ts` — NEW helper
- `src/modules/album/components/StickerCard.tsx` — replace Alert.alert + add useCallback

### Dependent Files
- Any other component using `Alert.alert` for confirmations may adopt this helper in future

## Deliverables

- `crossPlatformAlert.ts` utility
- `StickerCard.tsx` using the helper + useCallback
- Unit tests for both platform paths

## Tests

### Unit Tests
- [ ] `crossPlatformAlert` on native: calls `Alert.alert` with title, message, buttons
- [ ] `crossPlatformAlert` on web with confirm button: calls `window.confirm` and invokes confirm callback on `true`
- [ ] `crossPlatformAlert` on web with confirm button: does NOT invoke confirm callback on `false`
- [ ] `StickerCard` `handlePress` reference is stable across re-renders when deps unchanged (useCallback check)

### Integration Tests
- [ ] Web app: tapping a cross-album highlighted sticker shows `window.confirm` dialog
- [ ] Web app: confirming the dialog updates the source album sticker status

## Success Criteria

- All tests passing
- Cross-album confirmation dialog works on both web and iOS
- handlePress does not cause unnecessary StickerCard re-renders
