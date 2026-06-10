---
status: completed
title: "Switch EAS iOS Xcode image to stable (15.4)"
type: infra
complexity: low
dependencies: []
---

# Switch EAS iOS Xcode image to stable (15.4)


## Overview

The `eas.json` production iOS profile uses `macos-sequoia-15.6-xcode-26.1`, a beta Xcode toolchain. Beta toolchains produce binaries with linking issues that manifest as black screens on physical devices but not simulators. Switching to `macos-sonoma-14.4-xcode-15.4` (stable) eliminates this build-toolchain risk and is a required step before the Phase 1 validation build.

<critical>
- ALWAYS READ the PRD (F1.5) and TechSpec (Phase 1, step 2) before starting
- REFERENCE TECHSPEC for the chosen image name — do not guess
- FOCUS ON "WHAT" — change one field in eas.json
- MINIMIZE CODE — single field change
- TESTS REQUIRED — verify build succeeds with the new image
</critical>

<requirements>
1. `eas.json` production iOS `image` field MUST be changed from `macos-sequoia-15.6-xcode-26.1` to `macos-sonoma-14.4-xcode-15.4`.
2. No other `eas.json` fields MUST be modified in this task.
3. `autoIncrement: true` MUST remain in the production iOS profile (already present — do not remove).
4. The change MUST be validated by confirming the image name against Expo infrastructure docs before committing.
</requirements>

## Subtasks

- [x] 2.1 Confirm `macos-sonoma-14.4-xcode-15.4` is listed in Expo build infrastructure docs
- [x] 2.2 Change `image` field in `eas.json` production iOS profile
- [x] 2.3 Verify no other `eas.json` fields were accidentally modified

## Implementation Details

Change one field in `eas.json`:

```json
"ios": {
  "image": "macos-sonoma-14.4-xcode-15.4",
  "resourceClass": "m-medium",
  "autoIncrement": true
}
```

See TechSpec "Phase 1, step 2" and "Known Risks" section for fallback image options if 15.4 is unavailable.

### Relevant Files
- `eas.json` — change `build.production.ios.image`

### Dependent Files
- None — this is a build configuration change only

## Deliverables

- `eas.json` updated with stable Xcode image
- Confirmation that image name is valid per Expo docs

## Tests

### Unit Tests
- [ ] `eas.json` `build.production.ios.image` equals `macos-sonoma-14.4-xcode-15.4`
- [ ] `eas.json` `build.production.ios.autoIncrement` is still `true`
- [ ] No other production fields were changed

### Integration Tests
- [ ] EAS build with this image completes without Xcode toolchain errors (validated as part of Phase 1 build — task_04/05/06 prerequisite)

## Success Criteria

- All tests passing
- `eas.json` references stable Xcode image
- EAS build does not fail due to toolchain issues
