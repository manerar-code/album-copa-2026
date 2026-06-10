---
status: completed
title: "Add GestureHandlerRootView wrapper to App.tsx"
type: bugfix
complexity: low
dependencies:
  - task_04
---

# Add GestureHandlerRootView wrapper to App.tsx


## Overview

`react-native-gesture-handler 2.x` with New Architecture requires `GestureHandlerRootView` as the root of the component tree to initialize the gesture recognizer on the native thread. Without it, the gesture subsystem fails to initialize silently on iOS, preventing all tap interactions and causing a crash on startup with New Architecture enabled. This task wraps the App return value with `GestureHandlerRootView`.

<critical>
- ALWAYS READ the PRD (F1.3) and TechSpec "Core Interfaces — F1.1" section before starting
- REFERENCE TECHSPEC for the exact tree structure (GestureHandlerRootView wraps CatalogProvider)
- FOCUS ON "WHAT" — add one wrapper component to App.tsx
- MINIMIZE CODE — single import + JSX wrapper change
- TESTS REQUIRED — verify gestures work after change
</critical>

<requirements>
1. `GestureHandlerRootView` from `react-native-gesture-handler` MUST wrap the entire component tree returned by `App`.
2. `GestureHandlerRootView` MUST have `style={{ flex: 1 }}` to fill the screen.
3. The import MUST be added to `App.tsx`: `import { GestureHandlerRootView } from 'react-native-gesture-handler'`.
4. The wrapper MUST be the outermost element (outside `StatusBar`, `CatalogProvider`, `RootNavigator`).
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] 5.1 Add `GestureHandlerRootView` import to `App.tsx`
- [x] 5.2 Wrap the returned JSX tree with `<GestureHandlerRootView style={{ flex: 1 }}>`
- [x] 5.3 Verify the component tree order: GestureHandlerRootView → StatusBar + CatalogProvider → RootNavigator
- [x] 5.4 Verify no TypeScript errors after change

## Implementation Details

Modify `App.tsx` only. See TechSpec "Core Interfaces — F1.1" for the complete tree structure after this change.

Depends on task_04 because both modify `App.tsx` — complete task_04 first to avoid merge conflicts.

### Relevant Files
- `App.tsx` — add import + JSX wrapper

### Dependent Files
- `src/core/providers/CatalogProvider.tsx` — remains a child of GestureHandlerRootView
- `src/core/navigation/RootNavigator.tsx` — remains a grandchild; gesture recognition will now work correctly

## Deliverables

- `App.tsx` with `GestureHandlerRootView` as the root wrapper
- Smoke test confirming sticker card taps work on iOS

## Tests

### Unit Tests
- [ ] `App.tsx` imports `GestureHandlerRootView` from `react-native-gesture-handler`
- [ ] The outermost JSX element returned by `App` is `GestureHandlerRootView`
- [ ] `GestureHandlerRootView` has `style={{ flex: 1 }}`

### Integration Tests
- [ ] Tapping a sticker card on iOS (TestFlight) cycles its status (missing → owned → duplicate)
- [ ] No gesture-related crash on cold launch with New Architecture enabled

## Success Criteria

- All tests passing
- Sticker card taps work correctly on iOS after Phase 1 build
- No gesture recognizer crash in EAS build logs
