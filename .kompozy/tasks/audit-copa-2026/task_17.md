---
status: completed
title: "F13 — Migração de @testing-library/jest-native"
type: chore
complexity: low
dependencies:
  - task_16
---

# Task 17: F13 — Migração de @testing-library/jest-native

## Overview

Remove a dependência depreciada `@testing-library/jest-native` e a entrada correspondente em `setupFilesAfterEnv`. O `@testing-library/react-native` v13+ inclui todos esses matchers nativamente. A remoção elimina warnings de deprecação no `npm test` sem alterar nenhum teste existente.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 4 — F13 — Test Library Migration" for the exact steps
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST remove `"@testing-library/jest-native/extend-expect"` from `jest.setupFilesAfterEnv` in `package.json`
- MUST remove `"@testing-library/jest-native"` from `devDependencies` in `package.json`
- MUST run `npm install` to update `package-lock.json`
- MUST run `npm test -- --coverage` and verify all tests pass with zero deprecation warnings
- SHOULD verify current `@testing-library/react-native` version is ≥13.0 before removal (the built-in matchers require v13+; current package.json shows `^13.3.3`)
- If any test fails after removal with `TypeError: expect(...).toHaveStyle is not a function` or similar, MUST update the specific assertion to use the equivalent built-in matcher before marking complete
</requirements>

## Subtasks

- [x] 17.1 Remove `"@testing-library/jest-native/extend-expect"` from `jest.setupFilesAfterEnv` in `package.json`
- [x] 17.2 Remove `"@testing-library/jest-native": "^5.4.3"` from `devDependencies` in `package.json`
- [x] 17.3 Run `npm install` to update `package-lock.json`
- [x] 17.4 Run `npm test -- --coverage` and resolve any test failures caused by missing matchers

## Implementation Details

See TechSpec section "Phase 4 — F13 — Test Library Migration" for the exact steps.

Built-in matchers available in `@testing-library/react-native` v13+: `toBeOnTheScreen`, `toHaveTextContent`, `toHaveStyle`, `toBeEnabled`, `toBeDisabled`, `toHaveProp`, `toHaveAccessibilityValue`, and others that were previously in `@testing-library/jest-native`.

If a test uses `expect(el).toHaveStyle({...})` — this matcher IS available in RNTL v13+ natively. No change needed to the test itself.

If a test uses `expect(el).toBeVisible()` — check RNTL docs to confirm it is available in the installed version.

### Relevant Files

- `package.json` — remove `setupFilesAfterEnv` entry and `devDependency`
- `package-lock.json` — updated automatically by `npm install`
- `src/tests/unit/*.test.tsx` — may need assertion updates if any matchers are not available in RNTL v13

### Dependent Files

- None — all test files are read-only unless a missing matcher requires an update

### Related ADRs

None applicable.

## Deliverables

- `package.json` without `@testing-library/jest-native` in `devDependencies` or `setupFilesAfterEnv`
- Updated `package-lock.json`
- `npm test -- --coverage` output with zero failures and zero deprecation warnings

## Tests

- Unit tests:
  - [ ] All 17+ existing unit tests in `src/tests/unit/` pass without modification
  - [ ] No `DeprecationWarning: jest-native is deprecated` in test output
  - [ ] `toHaveStyle` assertions in `TypeSettingsModal.test.tsx` (e.g., `expect(uncheckedBox).toHaveStyle({ borderWidth: 1.5 })`) pass using RNTL built-in
  - [ ] `toHaveStyle` assertions in `OnboardingModal.test.tsx` (e.g., `expect(topBar).toHaveStyle({ paddingTop: 12 })`) pass using RNTL built-in
- Integration tests:
  - [ ] `npm test -- --coverage` exits 0 with coverage ≥80% on all metrics (branches, functions, lines, statements)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80% (branches, functions, lines, statements)
- `npm run lint` passes with zero errors
- `npm test 2>&1 | grep -i "deprecated"` returns no lines
- `package.json` devDependencies does not contain `@testing-library/jest-native`
- `jest.setupFilesAfterEnv` is empty or does not reference jest-native
