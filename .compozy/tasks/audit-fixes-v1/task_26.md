---
status: completed
title: "Clean up app.json (remove experiments block, enable predictiveBack)"
type: chore
complexity: low
dependencies: []
---

# Clean up app.json (remove experiments block, enable predictiveBack)


## Overview

`app.json` contains an `experiments` block that was used for Expo SDK 49 opt-ins (e.g., `tsconfigPaths`, `typedRoutes`). These are now default in SDK 56 and the `experiments` block is stale. Additionally, `android.adaptiveIcon` is missing `foregroundImage`, and `android.predictiveBack` is not enabled despite the app targeting Android 14+. Cleaning up these entries removes noise and enables the predictive back gesture for Android users.

<critical>
- ALWAYS READ the PRD (F3.11) and TechSpec "Phase 3, step 30" before starting
- FOCUS ON "WHAT" — remove stale experiments block, add predictiveBack, fix adaptiveIcon
- MINIMIZE CODE — JSON property removals and additions only
- TESTS REQUIRED — verify app.json schema is valid after changes
</critical>

<requirements>
1. The `experiments` block MUST be removed from `app.json` if it contains only SDK 49-era flags (`tsconfigPaths`, `typedRoutes`, `reactCompiler`).
2. `android.predictiveBack` MUST be set to `true`.
3. `android.adaptiveIcon.foregroundImage` MUST be present (use same value as `backgroundImage` if no separate foreground exists, or `./assets/adaptive-icon.png`).
4. No other sections of `app.json` may be modified by this task.
5. The resulting `app.json` MUST pass EAS schema validation (`npx expo config --type public` exits 0).
</requirements>

## Subtasks

- [ ] 26.1 Read `app.json` and identify the `experiments` block contents
- [ ] 26.2 Remove the `experiments` block (or individual stale flags if mixed with valid ones)
- [ ] 26.3 Add `"predictiveBack": true` under `android`
- [ ] 26.4 Verify `android.adaptiveIcon.foregroundImage` exists; add if missing
- [ ] 26.5 Run `npx expo config --type public` and confirm exit 0

## Implementation Details

Modify `app.json` only. See TechSpec "Phase 3, step 30" and PRD F3.11.

### Relevant Files
- `app.json` — root Expo config
- `assets/adaptive-icon.png` — expected foreground icon asset

### Dependent Files
- `eas.json` — references `app.json` for build config; no changes needed if `app.json` schema is valid

## Deliverables

- Cleaned `app.json` with `experiments` block removed and `predictiveBack: true`
- Confirmed `npx expo config --type public` exits 0

## Tests

### Unit Tests
- [ ] `app.json` JSON is syntactically valid (parse without error)
- [ ] `app.json` does NOT contain `experiments` key (or only contains non-stale experiments)
- [ ] `app.json` contains `android.predictiveBack: true`
- [ ] `app.json` contains `android.adaptiveIcon.foregroundImage`

### Integration Tests
- [ ] `npx expo config --type public` exits 0 with no warnings about deprecated fields
- [ ] EAS build dry-run (`npx eas build --platform android --profile production --json --non-interactive`) does not fail on config validation

## Success Criteria

- All tests passing
- `app.json` passes EAS config schema validation
- Android 14+ predictive back gesture enabled for next release
