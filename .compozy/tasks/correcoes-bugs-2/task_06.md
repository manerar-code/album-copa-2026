---
status: completed
title: "Fix album chip overlap with profile button"
type: bugfix
complexity: low
dependencies: []
---

## Overview

The album selector chip in the album screen header is overlapped by the floating profile avatar button (absolutely positioned at `top: 52, right: spacing.md, zIndex: 100`). This task reduces the chip's `maxWidth` and adds right margin to the chip container so it never renders under the profile button.

<critical>
- Read the PRD (BUG-06) and TechSpec (BUG-06 section) before starting.
- Do NOT change profile button position or navigation logic.
- Test at both 375px (iPhone SE) and 428px (iPhone Pro Max) widths.
- Tests are required as part of this task.
</critical>

<requirements>
1. The album chip MUST be fully visible without overlap by the profile button.
2. The chip container MUST have `marginRight` sufficient to clear the profile button (minimum 48px).
3. The chip `maxWidth` MUST be reduced to `140` to prevent overflow into button area.
4. The chip MUST remain tappable after the change.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Locate `albumChip` style in `ScreenHeader.tsx`
- [ ] Reduce `maxWidth` from `180` to `140`
- [ ] Add `marginRight: 48` to the chip container (`row2` or chip wrapper)
- [ ] Verify chip is fully visible and tappable on 375px width
- [ ] Check `HomeScreen.tsx` `headerRight` padding is still consistent

## Implementation Details

- `src/shared/components/ScreenHeader.tsx` — `albumChip` maxWidth, row2 marginRight
- `src/modules/dashboard/screens/HomeScreen.tsx` — verify `paddingRight: 56` on `headerRight` is still correct
- See TechSpec "BUG-06" section

### Relevant Files
- `src/shared/components/ScreenHeader.tsx` — albumChip style
- `src/modules/dashboard/screens/HomeScreen.tsx` — headerRight container

### Dependent Files
- No downstream task depends on this change

## Deliverables

- Album chip fully visible and tappable on all screens

## Tests

### Unit Tests
- [ ] `albumChip` style has `maxWidth <= 140`
- [ ] Row2 or chip wrapper has `marginRight >= 48`

### Integration Tests
- [ ] ScreenHeader renders album chip without overlap at 375px width
- [ ] Tapping the album chip opens the albums modal (navigation not broken)

## Success Criteria

- All tests passing
- Album chip fully visible on web app without overlap
