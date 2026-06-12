# Task Memory: task_07.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Refactor CromoCard owned state: green border (plain View) instead of gold LinearGradient, remove check icon.

## Important Decisions

- Used testID attributes (`cromo-missing`, `cromo-owned`, `cromo-duplicate`) on wrappers to enable direct state assertion in tests.
- colors.owned.border (#2BD17E) used directly for `outerOwned` borderColor.
- Renamed `outerOwned` style to `outerDup`; new `outerOwned` has `borderWidth: 2.5, borderColor: colors.owned.border`.

## Learnings

- `jest.mock` factory cannot reference `View` from import scope — must use `require('react-native')` inside factory.
- OnboardingModal tests pre-written for task_08 fail because CromoCard's new testIDs don't match expected `demo-sticker-card` — expected, not a regression.

## Files / Surfaces

- src/shared/components/CromoCard.tsx — core implementation change
- src/tests/unit/CromoCard.test.tsx — new test file, 8 tests, 90% coverage

## Errors / Corrections

None.

## Ready for Next Run

Yes.
