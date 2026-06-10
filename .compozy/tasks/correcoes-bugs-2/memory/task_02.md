# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Replace Faltantes tab icon from ❌ to 🔍 in `RootNavigator.tsx` `tabIcons` map.

## Important Decisions

- `tabIcons` is not exported from `RootNavigator.tsx`; will export it to enable unit test assertions.
- Tests will go in existing `src/tests/unit/RootNavigator.test.tsx`.

## Learnings

- Existing RootNavigator tests mock `createBottomTabNavigator` heavily, so integration tab rendering tests are limited.
- No existing tests verify tab icons at all.

## Files / Surfaces

- `src/core/navigation/RootNavigator.tsx` — change `Missing: '❌'` to `Missing: '🔍'`, export `tabIcons`.
- `src/tests/unit/RootNavigator.test.tsx` — add unit tests for tabIcons values.

## Errors / Corrections

## Ready for Next Run

Task is complete. No downstream dependencies. OnboardingModal.test.tsx and onboarding.test.tsx have pre-existing failures unrelated to this change.
