---
status: completed
title: "Add Android autoIncrement + secrets setup to eas.json"
type: infra
complexity: low
dependencies: []
---

# Add Android autoIncrement + secrets setup to eas.json


## Overview

The `eas.json` Android production profile does not have `autoIncrement: true`, meaning `versionCode` stays at 1 forever. Google Play rejects uploads with a `versionCode` equal to or lower than a previously uploaded build. Additionally, `eas submit --platform android` requires a Google Play service account JSON key at `secrets/service-account-key.json`, which does not exist. This task fixes both.

<critical>
- ALWAYS READ the PRD (F2.2) and TechSpec "Phase 2, step 16" before starting
- FOCUS ON "WHAT" — add autoIncrement to Android eas.json config + create secrets directory
- MINIMIZE CODE — two config changes + one manual key download step
- TESTS REQUIRED — verify autoIncrement field and secrets path
- BLOCKING DEPENDENCY: Google Play Console service account JSON key must be downloaded manually
</critical>

<requirements>
1. `eas.json` production Android block MUST add `"autoIncrement": true`.
2. A `secrets/` directory MUST be created in the project root.
3. `secrets/` MUST be listed in `.gitignore` (verify — do NOT commit the key file).
4. The `eas.json` `serviceAccountKeyPath` reference (`./secrets/service-account-key.json`) is already correct — only the key file itself needs to be placed there.
5. The Google Play service account key JSON MUST be downloaded from Google Play Console and placed at `secrets/service-account-key.json` (manual step).
</requirements>

## Subtasks

- [ ] 14.1 Add `"autoIncrement": true` to `eas.json` `build.production.android` block
- [ ] 14.2 Create `secrets/` directory in project root
- [ ] 14.3 Verify `secrets/` is in `.gitignore`
- [ ] 14.4 (Manual) Download Google Play service account JSON key and place at `secrets/service-account-key.json`
- [ ] 14.5 Verify `eas.json` `submit.production.android.serviceAccountKeyPath` points to `./secrets/service-account-key.json`

## Implementation Details

Modify `eas.json` and create `secrets/` directory. The service account key download is a manual step in Google Play Console.

### Relevant Files
- `eas.json` — add `autoIncrement: true` to `build.production.android`
- `.gitignore` — verify `secrets/` is excluded
- `secrets/service-account-key.json` — manual download, not tracked in git

## Deliverables

- `eas.json` with Android autoIncrement
- `secrets/` directory with `.gitkeep` placeholder
- Confirmed `secrets/` in `.gitignore`
- Service account key in place (manual)

## Tests

### Unit Tests
- [ ] `eas.json` `build.production.android.autoIncrement` is `true`
- [ ] `secrets/` directory exists in project root
- [ ] `.gitignore` contains `secrets/` entry
- [ ] `eas.json` `submit.production.android.serviceAccountKeyPath` equals `./secrets/service-account-key.json`

### Integration Tests
- [ ] `eas submit --platform android --latest` completes without "service account key not found" error

## Success Criteria

- All tests passing
- Android build submits to Google Play without versionCode conflict
- Service account key not committed to version control
