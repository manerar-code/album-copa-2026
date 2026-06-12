---
status: completed
title: "F3 — Build config: deploymentTarget, minSdk, targetSdk"
type: infra
complexity: low
dependencies: []
---

# Task 2: F3 — Build config: deploymentTarget, minSdk, targetSdk

## Overview

Atualiza o `app.json` para declarar explicitamente os requisitos de compatibilidade de plataforma. O iOS deployment target sobe de 16.4 para 17.0 (obrigatório para o Privacy Manifest). O Android recebe minSdkVersion 34 e targetSdkVersion 35, atendendo ao requisito do Google Play de agosto de 2025.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 1 — F3 — Build Configuration Hardening" for the exact app.json changes
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST change `expo.ios.deploymentTarget` from `"16.4"` to `"17.0"` in app.json
- MUST add `expo.android.minSdkVersion: 34` in app.json
- MUST add `expo.android.targetSdkVersion: 35` in app.json
- MUST verify that `eas build --platform=ios --dry-run` and `--platform=android --dry-run` complete without errors after the changes
- SHOULD document that versionCode (1) and buildNumber ("22") are inconsistent and should be aligned before store submission
</requirements>

## Subtasks

- [x] 2.1 Update `expo.ios.deploymentTarget` to `"17.0"` in app.json
- [x] 2.2 Add `expo.android.minSdkVersion: 34` in app.json
- [x] 2.3 Add `expo.android.targetSdkVersion: 35` in app.json
- [ ] 2.4 Verify build configuration compiles with `eas build --dry-run` for both platforms — ⚠️ MANUAL (EAS CLI)

## Implementation Details

See TechSpec section "Phase 1 — F3 — Build Configuration Hardening" for the exact JSON structure.

Note: `app.json` does not yet have a `runtimeVersion` or `updates` key — EAS Update is not configured and does not need to be in this task.

The versionCode/buildNumber inconsistency (versionCode: 1, buildNumber: "22") is out of scope for this task — document as a note, do not change values.

### Relevant Files

- `app.json` — only file to modify

### Dependent Files

- `task_11` (iOS Privacy Manifest) — depends on deploymentTarget 17.0 being set first, as privacyManifests requires iOS 17+

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — F3 is Phase 1
- [ADR-002 (referenced indirectly)](adrs/adr-002.md) — not directly related

## Deliverables

- `app.json` with updated platform targets
- Confirmation that `eas build --dry-run` passes for both platforms (manual verification note in commit message)

## Tests

- Unit tests:
  - [ ] No unit test applicable — app.json is a static config file with no runtime logic to test
- Integration tests:
  - [ ] `eas build --platform=ios --profile=production --dry-run` exits 0 with deploymentTarget 17.0
  - [ ] `eas build --platform=android --profile=production --dry-run` exits 0 with targetSdkVersion 35
- Test coverage target: N/A (config file change)
- All tests must pass

## Success Criteria

- `app.json` shows `deploymentTarget: "17.0"`, `minSdkVersion: 34`, `targetSdkVersion: 35`
- `npm run lint` passes (app.json is not linted but must remain valid JSON)
- No build regression — existing `npm test` still passes after change
