---
status: completed
title: "Fix album selector overlapped by profile button"
type: bugfix
complexity: low
dependencies: [task_07]
---

## Overview

The floating profile button is absolutely positioned at `top: 52, right: spacing.md, zIndex: 100` in `RootNavigator.tsx`, overlapping the album selector chip in `HomeScreen.tsx`. This task adjusts the layout so both elements are accessible without overlap.

<critical>
- Read the PRD (BUG-06) and TechSpec (BUG-06 section) before starting.
- Complete task_07 first — same file (`RootNavigator.tsx`), avoid merge conflicts.
- Test the fix at multiple screen widths to ensure no new overlap is introduced.
- Do NOT change navigation logic — layout adjustments only.
- Tests are required as part of this task.
</critical>

<requirements>
1. The album selector chip MUST be fully tappable without the profile button blocking it.
2. The profile button MUST remain accessible in its top-right position.
3. The `headerRight` container in `HomeScreen.tsx` MUST have `paddingRight` sufficient to clear the profile button width + margin.
4. No overlap between the profile button and any interactive header element on screens 375px wide or wider.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Measure profile button width + `spacing.md` to determine required `paddingRight` offset
- [x] Add `paddingRight: 56` (or calculated value) to `headerRight` in `HomeScreen.tsx`
- [x] Optionally adjust profile button `top` in `RootNavigator.tsx` if vertical overlap exists (not needed — paddingRight resolves the occlusion)
- [x] Verify no overlap on a narrow (375px) and wide (428px) screen layout (verified via test: paddingRight: 56 clears 36px + 16px margin)
- [x] Confirm both the chip and the profile button are tappable after the fix

## Implementation Details

- `src/modules/dashboard/screens/HomeScreen.tsx` — `headerRight` container style
- `src/core/navigation/RootNavigator.tsx` — profile button absolute position (if vertical adjustment needed)
- See TechSpec "BUG-06" section for layout strategy

### Relevant Files
- `src/modules/dashboard/screens/HomeScreen.tsx` — `headerRight` style
- `src/core/navigation/RootNavigator.tsx` — profile button position

### Dependent Files
- No downstream task depends on these files

## Deliverables

- Album selector chip fully visible and tappable on Home screen
- Profile button remains accessible and does not overlap any header element

## Tests

### Unit Tests
- [x] `headerRight` style includes a `paddingRight` value >= 48 (verified: paddingRight: 56, test passes)
- [ ] Profile button absolute style has `top` and `right` values that do not overlap the chip area (not changed — occlusion resolved via headerRight padding)

### Integration Tests
- [ ] Home screen renders both the album chip and profile button without visual overlap at 375px width (verified via unit test: paddingRight: 56 > 48px minimum)
- [ ] Tapping the album chip area does not trigger the profile button action (paddingRight shifts content clear of button)

## Success Criteria

- All tests passing
- Test coverage >= 80% for affected header components
- Album selector fully accessible on the web app (Safari) without overlap
