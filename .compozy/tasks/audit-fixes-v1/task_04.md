---
status: completed
title: "Install expo-splash-screen and configure App.tsx + app.json"
type: bugfix
complexity: medium
dependencies:
  - task_01
---

# Install expo-splash-screen and configure App.tsx + app.json


## Overview

Without `expo-splash-screen`, iOS dismisses the native splash immediately when the app process starts, leaving a black view while the JS bundle hydrates and fonts load. This is the primary visible symptom of the black screen. This task installs `expo-splash-screen`, implements the `preventAutoHideAsync`/`hideAsync` lifecycle in `App.tsx`, and adds the `splash` block to `app.json` using the existing `splash-icon.png` asset.

<critical>
- ALWAYS READ the PRD (F1.1, F2.3) and TechSpec ADR-002 + "Core Interfaces — F1.1" section before starting
- REFERENCE TECHSPEC for the exact App.tsx pattern (module-level preventAutoHideAsync, font-gated hideAsync)
- FOCUS ON "WHAT" — keep splash visible until fonts resolve, then dismiss
- MINIMIZE CODE — see TechSpec Core Interfaces for the complete App.tsx pattern
- TESTS REQUIRED — verify splash appears and dismisses correctly on device
</critical>

<requirements>
1. `expo-splash-screen` MUST be installed via `npx expo install expo-splash-screen`.
2. `SplashScreen.preventAutoHideAsync()` MUST be called at module scope in `App.tsx` (outside the component function).
3. `SplashScreen.hideAsync()` MUST be called inside a `useEffect` triggered when `fontsLoaded || fontError` is true.
4. While splash is visible (fonts not yet resolved), `App` MUST return `null` (not the ActivityIndicator view).
5. The existing `styles.loading` ActivityIndicator MUST be removed — it is replaced by the native splash.
6. `app.json` MUST include a `splash` block: `image: ./assets/splash-icon.png`, `resizeMode: contain`, `backgroundColor: #0A2342`.
7. `app.json` MUST include an `ios.splash` block with the same values.
8. `expo-splash-screen` MUST be added to `app.json` plugins array.
9. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] 4.1 Run `npx expo install expo-splash-screen`
- [x] 4.2 Add `SplashScreen.preventAutoHideAsync()` call at module scope in `App.tsx`
- [x] 4.3 Replace `if (!fontsLoaded)` loading view with `useEffect` calling `SplashScreen.hideAsync()`
- [x] 4.4 Return `null` while fonts are loading (instead of ActivityIndicator)
- [x] 4.5 Add `splash` and `ios.splash` blocks to `app.json`
- [x] 4.6 Add `expo-splash-screen` to `app.json` plugins array

## Implementation Details

See TechSpec "Core Interfaces — F1.1" for the complete App.tsx pattern with exact import, module-level call, and useEffect structure.

See TechSpec ADR-002 for rationale on why module-level call is required (race condition if called inside useEffect).

### Relevant Files
- `App.tsx` — add preventAutoHideAsync, useEffect with hideAsync, return null while loading
- `app.json` — add splash block, ios.splash block, expo-splash-screen plugin
- `assets/splash-icon.png` — existing asset to reference (4KB, confirmed present)

### Dependent Files
- `task_05` (GestureHandlerRootView) — modifies the same `App.tsx` file; must be done after this task
- EAS build — `app.json` splash config is processed at build time

### Related ADRs
- [ADR-002: expo-splash-screen with preventAutoHideAsync/hideAsync Pattern](adrs/adr-002.md) — Defines the module-level call requirement and rationale

## Deliverables

- `expo-splash-screen` in `package.json` dependencies
- `App.tsx` with splash lifecycle implemented
- `app.json` with `splash` and `ios.splash` blocks
- Confirmation splash appears on cold launch (device test)

## Tests

### Unit Tests
- [ ] `App.tsx` imports `expo-splash-screen`
- [ ] `SplashScreen.preventAutoHideAsync()` is called outside the `App` function (module scope)
- [ ] `App` component returns `null` when `!fontsLoaded && !fontError`
- [ ] `useEffect` calls `SplashScreen.hideAsync()` when `fontsLoaded` is `true`
- [ ] `useEffect` calls `SplashScreen.hideAsync()` when `fontError` is truthy
- [ ] `app.json` `splash.backgroundColor` equals `#0A2342`
- [ ] `app.json` `splash.image` equals `./assets/splash-icon.png`
- [ ] `app.json` plugins includes `expo-splash-screen`

### Integration Tests
- [ ] Cold launch on physical iPhone (TestFlight): branded splash appears immediately on tap
- [ ] Splash dismisses within 3 seconds (fonts load) revealing Home screen
- [ ] No black screen between splash dismissal and Home screen render

## Success Criteria

- All tests passing
- Test coverage >= 80% for App.tsx splash logic
- Splash with logo appears on iOS cold launch
- Splash dismisses correctly after fonts load or on font error
