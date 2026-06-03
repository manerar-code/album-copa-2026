---
status: completed
title: "iOS build configuration for TestFlight"
type: infra
complexity: low
dependencies: [task_01, task_02, task_03, task_04, task_05, task_06, task_07, task_08, task_09]
---

## Overview

The iOS build on TestFlight renders a black screen. The root cause is `react-native-reanimated@4.3.1` requiring the New Architecture (`newArchEnabled: true`) and its peer dependency `react-native-worklets`. This task verifies the build configuration is correct and triggers a new EAS build after all code fixes are complete.

<critical>
- Read the PRD (BUG-01) and TechSpec (BUG-01 section) before starting.
- This task MUST be the last executed — all code fixes (task_01 through task_09) must be complete.
- Do NOT change `newArchEnabled` back to `false` — it must stay `true`.
- Validation is only possible after a successful EAS build and TestFlight install.
- Tests for this task are build-level: verify the app renders on a physical iPhone via TestFlight.
</critical>

<requirements>
1. `app.json` MUST have `"newArchEnabled": true`.
2. `react-native-worklets` MUST be listed in `package.json` dependencies.
3. `eas.json` production iOS profile MUST use `"image": "macos-sequoia-15.6-xcode-26.1"`.
4. `buildNumber` in `app.json` MUST be incremented from the previous failed build.
5. After a successful EAS build, the app MUST be submitted to TestFlight via `eas submit`.
6. The app MUST open and render the Home screen on a physical iPhone via TestFlight.
</requirements>

## Subtasks

- [x] Verify `app.json`: `newArchEnabled: true` and `buildNumber` is incremented
- [x] Verify `package.json`: `react-native-worklets` is present in dependencies
- [x] Verify `eas.json`: iOS production image is `macos-sequoia-15.6-xcode-26.1`
- [ ] Run `npx eas build --platform ios --profile production` (manual)
- [ ] After successful build, run `npx eas submit --platform ios --latest` (manual)
- [ ] Install from TestFlight on a physical iPhone and confirm Home screen renders (manual)

## Implementation Details

- `app.json` — `newArchEnabled`, `buildNumber`
- `package.json` — `react-native-worklets` dependency
- `eas.json` — `build.production.ios.image`
- EAS CLI commands: `eas build`, `eas submit`

### Relevant Files
- `app.json` — build configuration
- `eas.json` — EAS build profiles
- `package.json` — dependency list

### Dependent Files
- None — this is the final delivery task

### Related ADRs
- [ADR-001](adrs/adr-001.md) — All fixes ship in a single EAS build

## Deliverables

- Successful EAS build artifact (`.ipa`) for iOS production
- Build submitted to TestFlight
- App opens and renders Home screen on a physical iPhone

## Tests

### Unit Tests
- [x] `app.json` contains `"newArchEnabled": true`
- [x] `package.json` contains `"react-native-worklets"` in dependencies
- [x] `eas.json` production iOS image is `"macos-sequoia-15.6-xcode-26.1"`

### Integration Tests
- [ ] EAS build completes with status "finished" (no errors)
- [ ] EAS submit completes and build appears in App Store Connect TestFlight
- [ ] App opens on iPhone via TestFlight and Home screen renders without black screen

## Success Criteria

- EAS build status: finished
- TestFlight build processed and available
- App renders correctly on a physical iPhone — no black screen
