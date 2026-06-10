---
status: completed
title: "Remove react-native-worklets from package.json"
type: infra
complexity: low
dependencies: []
---

# Remove react-native-worklets from package.json


## Overview

`react-native-worklets 0.8.3` is installed alongside `react-native-reanimated 4.x`, which bundles its own worklets runtime internally. Under New Architecture (TurboModules), both packages register conflicting module identifiers, causing a silent JS runtime crash on iOS before `App()` is ever called. Removing the standalone worklets package eliminates this TurboModule conflict and is the highest-priority fix for the black screen.

<critical>
- ALWAYS READ the PRD (F1.2) and TechSpec (Phase 1, step 1) before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — remove the conflicting package and verify no animation regressions
- MINIMIZE CODE — single package.json change + npm install
- TESTS REQUIRED — smoke-test all animated screens after removal
</critical>

<requirements>
1. `react-native-worklets` MUST be removed from `package.json` dependencies.
2. `npm install` MUST be run after removal to update `package-lock.json`.
3. No other package versions MUST be changed during this operation.
4. All existing animations (CromoCard, AlbumListScreen) MUST remain functional after removal.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] 1.1 Run `npm uninstall react-native-worklets` in the project root
- [x] 1.2 Verify `package.json` no longer contains `react-native-worklets`
- [x] 1.3 Verify `package-lock.json` is updated (no worklets entry)
- [x] 1.4 Run `npx expo start --web` and verify animated screens render correctly
- [x] 1.5 Confirm no TypeScript or Metro bundle errors after removal

## Implementation Details

Single `npm uninstall` command. No source file changes required.

See TechSpec "Phase 1, step 1" and "Known Risks" section for details on the TurboModule conflict and regression risk.

### Relevant Files
- `package.json` — remove `react-native-worklets` entry from dependencies
- `package-lock.json` — updated automatically by npm uninstall

### Dependent Files
- `src/shared/components/CromoCard.tsx` — uses reanimated animations; must still work after removal
- `src/modules/album/screens/AlbumListScreen.tsx` — may use animated values; verify after removal

### Related ADRs
- [ADR-001: Three-Phase Rollout](adrs/adr-001.md) — this task is the first step of Phase 1

## Deliverables

- `package.json` with `react-native-worklets` removed
- Updated `package-lock.json`
- Smoke test confirmation that animations still work on web

## Tests

### Unit Tests
- [ ] `package.json` does NOT contain `react-native-worklets` in dependencies or devDependencies
- [ ] `react-native-reanimated` version is still `4.3.1` (unchanged)

### Integration Tests
- [ ] Web app (`npm run web`) starts without Metro bundle errors after removal
- [ ] CromoCard animations (owned/duplicate state transitions) render correctly on web
- [ ] No `TurboModuleRegistry` error in Metro output after removal

## Success Criteria

- All tests passing
- `react-native-worklets` absent from `package.json`
- No animation regressions on web after removal
- Ready for Phase 1 EAS build
