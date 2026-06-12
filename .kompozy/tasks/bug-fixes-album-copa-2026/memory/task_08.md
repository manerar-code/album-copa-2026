# Task Memory: task_08.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Fix album selector chip overlapped by absolutely-positioned profile button (`top: 52, right: spacing.md, zIndex: 100` in RootNavigator.tsx).

## Important Decisions

- Chose `paddingRight: 56` on `headerRight` in HomeScreen.tsx over moving the profile button or adjusting zIndex. This is the most targeted fix — it shifts headerRight content left by (36px button width + 16px `spacing.md` margin + 4px buffer) without changing the button position.
- Profile button position in RootNavigator.tsx left unchanged; no vertical overlap adjustment needed since horizontal shift resolves the occlusion.

## Learnings

- `spacing.md` = 16px (confirmed from theme)

## Files / Surfaces

- `src/modules/dashboard/screens/HomeScreen.tsx` — `headerRight` style (added `paddingRight: 56`) and `testID="header-right"`
- `src/tests/unit/HomeScreen.test.tsx` — new test file with 2 tests verifying `paddingRight >= 48`

## Errors / Corrections

None.

## Ready for Next Run

Task complete. 2 unit tests passing. No regression in RootNavigator tests.
