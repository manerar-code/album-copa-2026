# Task Memory: task_11.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

F7: iOS Privacy Manifest. Add `privacyManifests` to `app.json` + `ios/PrivacyInfo.xcprivacy`.

## Important Decisions

- Both `app.json` privacyManifests block and `ios/PrivacyInfo.xcprivacy` were verified present and correct in working tree (pre-existing changes, likely added alongside task_02)
- `eas build --dry-run` flag does not exist in EAS CLI v20.1.0 — used `npx expo config --type public` to confirm privacy manifests are picked up

## Learnings

- EAS CLI v20.1.0 has no `--dry-run` flag for `eas build`; use `npx expo config --type public` to verify Expo-managed configs locally

## Files / Surfaces

- `app.json` — privacyManifests block in expo.ios section (verified correct)
- `ios/PrivacyInfo.xcprivacy` — plist XML file (verified correct)

## Errors / Corrections

None — both files were already present with correct content in working tree.

## Ready for Next Run

Task is complete. No code changes were needed — both files were already correctly configured.
