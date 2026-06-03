---
status: completed
title: "Fix album delete via Alert.alert"
type: bugfix
complexity: low
dependencies: [task_05]
---

## Overview

The `handleDelete` function uses a `confirm()` helper that does not execute its callback on web (Safari). This task replaces `confirm()` with a direct `Alert.alert()` call that includes proper error handling and works consistently on web and iOS.

<critical>
- Read the PRD (BUG-04) and TechSpec (BUG-04 section) before starting.
- Complete task_05 first — same file, avoid merge conflicts.
- Do NOT change the deletion logic (service calls, store updates) — only the confirmation mechanism.
- Add try/catch and error Alert to the deletion callback.
- Tests are required as part of this task.
</critical>

<requirements>
1. `handleDelete` MUST use `Alert.alert` directly, not a `confirm()` wrapper.
2. The alert MUST have "Cancelar" (cancel) and "Excluir" (destructive) buttons.
3. The deletion callback MUST be wrapped in `try/catch` with a user-facing error alert on failure.
4. `setLoading(true/false)` MUST be called correctly around the async deletion.
5. If the deleted album was active, the app MUST switch to `remaining[0]` before the modal closes.
6. TypeScript strict — no `any` in the catch block (use `unknown` + type guard).
</requirements>

## Subtasks

- [x] Replace `confirm(...)` call with `Alert.alert(title, message, buttons)` in `handleDelete`
- [x] Add `try/catch` with `Alert.alert('Erro', '...')` in the destructive button's `onPress`
- [x] Wrap deletion in `setLoading(true)` / `finally { setLoading(false) }`
- [x] Verify album switch logic runs correctly when deleting the active album
- [x] Test: delete a non-active album → removed from list; delete active album → switches to next

## Implementation Details

- `src/modules/auth/components/UserAlbumsModal.tsx` — `handleDelete` function
- See TechSpec "BUG-04" section for the complete `Alert.alert` code pattern

### Relevant Files
- `src/modules/auth/components/UserAlbumsModal.tsx` — only file to change
- `src/shared/services/userAlbumService.ts` — `remove(id)` called inside the callback

### Dependent Files
- No downstream task depends on this file

## Deliverables

- Album delete works on web (Safari) and iOS via `Alert.alert`
- Error is shown to the user if deletion fails
- Active album switches correctly when the active album is deleted

## Tests

### Unit Tests
- [x] `handleDelete` with 2+ albums calls `Alert.alert` with destructive button
- [x] Confirming delete calls `userAlbumService.remove(album.id)`
- [x] `userAlbumService.remove` throwing an Error shows an error Alert
- [x] `userAlbumService.remove` throwing a non-Error shows generic error Alert

### Integration Tests
- [x] Deleting a non-active album removes it from the list without switching active album
- [x] Deleting the active album switches `activeUserAlbumId` to `remaining[0].id`

## Success Criteria

- All tests passing
- Test coverage >= 80% for `UserAlbumsModal` delete path
- Album delete works reliably on web and iOS
