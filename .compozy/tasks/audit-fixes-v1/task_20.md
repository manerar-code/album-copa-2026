---
status: completed
title: "Add typeof window guard to RootNavigator window references"
type: bugfix
complexity: low
dependencies: []
---

# Add typeof window guard to RootNavigator window references


## Overview

`RootNavigator.tsx` references `window.confirm`, `window.location.href`, and `window.location.origin` inside a `Platform.OS === 'web'` guard. While the guard prevents execution on native, Metro's module bundler under New Architecture can still evaluate module-level references to `window` during tree-shaking, potentially causing a `ReferenceError`. Adding `typeof window !== 'undefined'` as a secondary guard makes the references safe under any bundler configuration.

<critical>
- ALWAYS READ the PRD (F3.5) and TechSpec "Phase 3, step 24" before starting
- FOCUS ON "WHAT" — add defensive typeof check alongside existing Platform.OS check
- MINIMIZE CODE — one compound condition change
- TESTS REQUIRED — verify no ReferenceError on native and web behavior unchanged
</critical>

<requirements>
1. All `window` references in `RootNavigator.tsx` MUST be guarded with BOTH `Platform.OS === 'web'` AND `typeof window !== 'undefined'`.
2. The combined condition MUST be: `if (Platform.OS === 'web' && typeof window !== 'undefined')`.
3. The web logout behavior (confirm dialog + location redirect) MUST remain functionally identical.
4. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 20.1 Locate all `window` references in `RootNavigator.tsx` (confirm they are inside the Platform.OS check)
- [ ] 20.2 Add `&& typeof window !== 'undefined'` to the existing `Platform.OS === 'web'` condition
- [ ] 20.3 Verify web logout still shows confirm dialog and redirects correctly

## Implementation Details

Modify `src/core/navigation/RootNavigator.tsx` only. The existing code already has `Platform.OS === 'web'` — add one `&&` condition.

### Relevant Files
- `src/core/navigation/RootNavigator.tsx` — window references in logout handler (lines 83-90)

## Deliverables

- `RootNavigator.tsx` with defensive typeof window guard
- Confirmed web logout still works

## Tests

### Unit Tests
- [ ] Web logout handler: `Platform.OS === 'web' && typeof window !== 'undefined'` condition evaluates correctly
- [ ] Native platform: window block is not executed (no ReferenceError thrown)

### Integration Tests
- [ ] Web app (`npm run web`): profile button logout shows confirm dialog and redirects to origin
- [ ] iOS TestFlight: logout uses `Alert.alert` (native path, unchanged)

## Success Criteria

- All tests passing
- No ReferenceError in Metro bundle under New Architecture
- Web logout behavior unchanged
