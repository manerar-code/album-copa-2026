---
status: completed
title: "Add album name fallback in UserAlbumsModal"
type: bugfix
complexity: low
dependencies: []
---

## Overview

When an album's `name` field is `null`, `undefined`, or an empty string, the album row renders with no visible name — showing only the edit and delete icons. This task adds a fallback display name so every album row always shows readable text.

<critical>
- Read the PRD (BUG-01) and TechSpec (BUG-01 section) before starting.
- Do NOT change album delete or rename logic — only the display fallback.
- The fallback must be display-only; it must NOT be persisted to the database.
- Tests are required as part of this task.
</critical>

<requirements>
1. Every album row MUST display a non-empty name string.
2. If `album.name` is `null`, `undefined`, or empty string after trim, the display MUST show `'Coleção sem nome'`.
3. The fallback MUST NOT be passed to rename or delete operations — those use `album.name` directly.
4. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Locate the album name `<Text>` render in `UserAlbumsModal.tsx`
- [ ] Replace `{album.name}` with `{album.name?.trim() || 'Coleção sem nome'}`
- [ ] Verify rename flow still uses the original `album.name` (not the fallback)
- [ ] Test: render an album with empty name → shows "Coleção sem nome"

## Implementation Details

- `src/modules/auth/components/UserAlbumsModal.tsx` — album name Text render
- See TechSpec "BUG-01" section for the exact fallback pattern

### Relevant Files
- `src/modules/auth/components/UserAlbumsModal.tsx` — only file to change

### Dependent Files
- No downstream task depends on this change

## Deliverables

- Every album row displays a visible name in the collection list

## Tests

### Unit Tests
- [ ] Album with `name: ''` renders `'Coleção sem nome'`
- [ ] Album with `name: null` renders `'Coleção sem nome'`
- [ ] Album with `name: 'Copa 2026'` renders `'Copa 2026'`
- [ ] Rename flow receives `album.name` (original), not the fallback string

### Integration Tests
- [ ] UserAlbumsModal with 2 albums (one named, one empty) renders both rows with visible text

## Success Criteria

- All tests passing
- Test coverage >= 80% for album name render in UserAlbumsModal
- No album row appears without a visible name on the web app
