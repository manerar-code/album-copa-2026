---
status: completed
title: "Fix selection name truncation with badge max-width"
type: bugfix
complexity: low
dependencies: []
---

## Overview

In the album selection list, the duplicate badge has no fixed width and compresses the selection name when both elements share a row. This task adds `maxWidth: 64` to the badge and ensures the name `View` has `flex: 1` with `ellipsizeMode="tail"` so the name uses all available space.

<critical>
- Read the PRD (BUG-07) and TechSpec (BUG-07 section) before starting.
- Do NOT change navigation or selection tap logic — styling only.
- The name may truncate with ellipsis but must NEVER be completely invisible.
- Tests are required as part of this task.
</critical>

<requirements>
1. The duplicate badge MUST have a fixed `maxWidth: 64` style.
2. The selection name `Text` MUST use `flex: 1`, `numberOfLines={1}`, and `ellipsizeMode="tail"`.
3. When badge is present, name MUST use remaining space after badge — never zero width.
4. When badge is absent, name MUST fill the full available row width.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Locate the selection name + badge row in `AlbumListScreen.tsx`
- [ ] Add `maxWidth: 64` to the badge style
- [ ] Add `ellipsizeMode="tail"` to the name `<Text>` component
- [ ] Ensure the name container has `flex: 1`
- [ ] Test: selection with long name + badge — name truncates with ellipsis, badge fully visible

## Implementation Details

- `src/modules/album/screens/AlbumListScreen.tsx` — name Text and badge style
- See TechSpec "BUG-07" section for style targets

### Relevant Files
- `src/modules/album/screens/AlbumListScreen.tsx` — only file to change

### Dependent Files
- No downstream task depends on this change

## Deliverables

- Selection names use available space and truncate gracefully when a badge is present

## Tests

### Unit Tests
- [ ] Selection row with long name and badge renders name with `ellipsizeMode="tail"`
- [ ] Badge style includes `maxWidth: 64`
- [ ] Selection row without badge renders name with `flex: 1` and full width

### Integration Tests
- [ ] "Copa do Mundo FIFA 2026" with "1 rep" badge renders both elements without name being hidden
- [ ] Selection with no duplicates renders full name without truncation

## Success Criteria

- All tests passing
- Test coverage >= 80% for selection row layout
- Selection names are always visible (even if truncated) on the web app
