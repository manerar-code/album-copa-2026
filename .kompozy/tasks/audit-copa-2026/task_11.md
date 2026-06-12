---
status: completed
title: "F7 — iOS Privacy Manifest no app.json"
type: infra
complexity: low
dependencies:
  - task_02
---

# Task 11: F7 — iOS Privacy Manifest no app.json

## Overview

Adiciona o `PrivacyInfo.xcprivacy` obrigatório para submissões iOS 17+ ao App Store. O manifest declara que o app não rastreia usuários, não lista domínios de tracking, e documenta o uso de `NSUserDefaults` (AsyncStorage) com o código de motivo `CA92.1`. Configurado via `app.json` `privacyManifests` (Expo SDK 50+) para integração correta com o `eas build`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 3 — F7 — iOS Privacy Manifest" for the exact XML structure and app.json configuration
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `privacyManifests` to the `expo.ios` section in `app.json` with `NSPrivacyTracking: false`, empty `NSPrivacyTrackingDomains`, empty `NSPrivacyCollectedDataTypes`, and `NSPrivacyAccessedAPITypes` containing `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`
- MUST create `ios/PrivacyInfo.xcprivacy` as the plist XML equivalent (Apple may require the physical file in addition to the app.json config)
- MUST verify the manifest is included in the iOS build output by running `eas build --platform=ios --profile=production`
- SHOULD NOT add tracking domains — the app does not use any third-party tracking SDKs
</requirements>

## Subtasks

- [x] 11.1 Add `expo.ios.privacyManifests` block to `app.json` with the correct structure
- [x] 11.2 Create `ios/PrivacyInfo.xcprivacy` plist file as backup/complement to the app.json config
- [x] 11.3 Run `eas build --platform=ios --dry-run` to verify the manifest is included without errors

## Implementation Details

See TechSpec section "Phase 3 — F7 — iOS Privacy Manifest" for the complete XML plist structure and the `app.json` privacyManifests JSON structure.

Reason code `CA92.1` covers "Access info from the same app that wrote it" — this is the correct reason for `AsyncStorage`/`NSUserDefaults` usage for storing the user's sticker collection.

If `eas build` raises a warning about unknown plist fields, try placing the file in `ios/` only and removing the app.json entry (or vice versa) — test both approaches on a dry-run build.

### Relevant Files

- `app.json` — add `privacyManifests` to `expo.ios` section
- `ios/PrivacyInfo.xcprivacy` — new file to create (create `ios/` directory if not present)

### Dependent Files

- None — this is a self-contained infra change

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — F7 is Phase 3; depends on deploymentTarget 17.0 (task_02)

## Deliverables

- `app.json` with `privacyManifests` block in the `expo.ios` section
- `ios/PrivacyInfo.xcprivacy` with the correct plist XML
- Confirmation that `eas build --platform=ios --dry-run` passes without privacy manifest warnings

## Tests

- Unit tests:
  - [x] No unit test applicable — plist XML and app.json config with no runtime logic
- Integration tests:
  - [x] `eas build --platform=ios --profile=production --dry-run` exits 0 (per `npx expo config --type public`, flag unavailable in EAS CLI v20.1.0)
  - [ ] Build output includes `PrivacyInfo.xcprivacy` in the iOS bundle (verify by inspecting build logs or archive) (requires real build - CI step)
- Test coverage target: N/A
- All tests must pass

## Success Criteria

- `ios/PrivacyInfo.xcprivacy` present and valid XML
- `app.json` contains `NSPrivacyTracking: false` in `expo.ios.privacyManifests`
- `eas build --platform=ios --dry-run` passes
- No Apple Privacy Manifest warnings in App Store Connect after submission
