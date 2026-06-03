---
status: completed
title: "Fix album name pre-fill on edit screen"
type: bugfix
complexity: low
dependencies: [task_04]
---

## Overview

When the user taps the edit icon on an album, the name input field appears empty instead of showing the current album name. The fix ensures `setEditingName(album.name)` is called synchronously before `setEditingId(album.id)` and that the TextInput `value` prop is correctly conditional.

<critical>
- Read the PRD (BUG-05) and TechSpec (BUG-05 section) before starting.
- Complete task_04 first — TextInput color must be fixed so the pre-filled text is visible.
- Do NOT change rename save logic — only the initial state when entering edit mode.
- Tests are required as part of this task.
</critical>

<requirements>
1. When the edit icon is tapped, the TextInput MUST display the current album name immediately.
2. `setEditingName(album.name)` MUST be called before `setEditingId(album.id)` in the edit trigger handler.
3. The TextInput `value` prop MUST use `editingId === album.id ? editingName : ''` to prevent cross-row contamination.
4. After a successful rename, `editingName` MUST be cleared (set to `''`).
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Read the edit icon `onPress` handler in `UserAlbumsModal.tsx` and verify call order
- [ ] Ensure `setEditingName(album.name)` is called before `setEditingId(album.id)`
- [ ] Update TextInput `value` prop to `editingId === album.id ? editingName : ''`
- [ ] Add `setEditingName('')` after successful rename in `handleRename`
- [ ] Test: open edit mode on an album with an existing name and confirm the field is pre-filled

## Implementation Details

- `src/modules/auth/components/UserAlbumsModal.tsx` — edit icon handler, `handleRename`, TextInput value prop
- See TechSpec "BUG-05" section for the exact fix pattern

### Relevant Files
- `src/modules/auth/components/UserAlbumsModal.tsx` — only file to change

### Dependent Files
- `task_06` (album delete fix) edits the same file — do after this task

## Deliverables

- Album edit field pre-fills with the current album name when edit mode opens
- Field clears correctly after a successful rename

## Tests

### Unit Tests
- [ ] Opening edit mode for an album with name "Copa 2026" sets `editingName` to "Copa 2026"
- [ ] TextInput `value` is empty for albums not in edit mode (`editingId !== album.id`)
- [ ] After `handleRename` succeeds, `editingName` is reset to `''`

### Integration Tests
- [ ] Edit icon tap → TextInput shows current album name immediately
- [ ] Renaming one album does not affect the displayed name of other albums in the list

## Success Criteria

- All tests passing
- Test coverage >= 80% for `UserAlbumsModal`
- Tapping edit on any album shows its current name in the input field
