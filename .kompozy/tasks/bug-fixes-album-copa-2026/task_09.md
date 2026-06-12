---
status: completed
title: "Cross-album duplicate signaling and confirmation"
type: bugfix
complexity: medium
dependencies: [task_01]
---

## Overview

When a sticker is marked as "duplicate" in Album A, it is not visually indicated in Album B. This task adds a `getCrossAlbumDuplicateSources` selector to `stickerStore.ts`, highlights affected sticker cards in red, and shows a confirmation dialog when the user marks the sticker as "owned" — asking if they also want to update Album A.

<critical>
- Read the PRD (BUG-07) and TechSpec (BUG-07 section) before starting.
- Complete task_01 first — `displayType()` must be available for any type labels in this flow.
- Do NOT mutate Album A state without explicit user confirmation via `Alert.alert`.
- The selector MUST be pure — no side effects, no async calls.
- Tests are required as part of this task.
</critical>

<requirements>
1. `getCrossAlbumDuplicateSources(figurinhaId: string): string[]` MUST be added to `stickerStore.ts` and return album IDs (excluding the active album) where the sticker is `'duplicate'`.
2. A sticker card MUST display a red highlight border (`borderColor: '#E74C3C'`, `borderWidth: 2`) when: its status in the active album is `'missing'` AND `getCrossAlbumDuplicateSources` returns a non-empty array.
3. Tapping a cross-album-highlighted sticker MUST set its status to `'owned'` in the active album.
4. After marking as owned, `Alert.alert` MUST ask the user if they want to update Album A to `'owned'`.
5. If the user confirms, the sticker in every source album MUST be updated from `'duplicate'` to `'owned'`.
6. If the user cancels, Album A is NOT modified.
7. Alert message MUST include the source album name (use `userAlbums` from auth store to resolve name by ID).
8. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Add `getCrossAlbumDuplicateSources(figurinhaId: string): string[]` selector to `stickerStore.ts`
- [x] In the sticker card render path, call the selector and determine if red highlight applies
- [x] Apply red border style to the sticker card when cross-album highlight conditions are met
- [x] Override the default tap handler for highlighted stickers: set status to `'owned'` first
- [x] After status update, call `Alert.alert` with album name and Yes/No buttons
- [x] On confirm: call `setStatus(figurinhaId, 'owned', sourceAlbumId)` for each source album
- [x] Write unit tests for the selector and integration tests for the confirmation flow

## Implementation Details

- `src/modules/album/store/stickerStore.ts` — add `getCrossAlbumDuplicateSources` selector
- `src/modules/album/components/StickerCard.tsx` — consume selector, apply highlight, handle tap
- Use `useAuthStore` or equivalent to resolve album names from IDs for the Alert message
- See TechSpec "BUG-07" section for the full selector implementation and ADR-002, ADR-003

### Relevant Files
- `src/modules/album/store/stickerStore.ts` — add selector
- `src/modules/album/components/StickerCard.tsx` — highlight and tap logic
- `src/modules/auth/store/authStore.ts` — resolve album name from ID

### Dependent Files
- Any screen that renders `StickerCard` will inherit the new highlight behavior automatically

### Related ADRs
- [ADR-002](adrs/adr-002.md) — Cross-album detection via store selector in `stickerStore.ts`
- [ADR-003](adrs/adr-003.md) — Confirmation dialog uses `Alert.alert`, not a custom modal

## Deliverables

- `getCrossAlbumDuplicateSources` selector in `stickerStore.ts`
- Red highlight on sticker cards that are available from another album's duplicates
- Confirmation dialog that correctly updates Album A on user confirmation

## Tests

### Unit Tests
- [x] `getCrossAlbumDuplicateSources('fig_1')` returns `['album_B']` when `allCollections.album_B['fig_1'] === 'duplicate'` and `activeUserAlbumId !== 'album_B'`
- [x] `getCrossAlbumDuplicateSources('fig_1')` returns `[]` when the sticker is not duplicate in any other album
- [x] `getCrossAlbumDuplicateSources('fig_1')` excludes the active album from results
- [x] Sticker card applies red border style when selector returns non-empty and sticker is `'missing'`
- [x] Sticker card does NOT apply red border when selector returns empty array
- [x] Sticker card does NOT apply red border when sticker is `'owned'` or `'duplicate'` in active album (even if source exists)

### Integration Tests
- [x] Tapping a highlighted sticker sets active album status to `'owned'` and shows Alert
- [x] Confirming the Alert sets source album sticker from `'duplicate'` to `'owned'`
- [x] Cancelling the Alert leaves source album sticker as `'duplicate'`

## Success Criteria

- All tests passing
- Test coverage >= 80% for selector and `StickerCard` highlight path
- Red highlighting appears correctly in web app when cross-album duplicates exist
- Confirmation dialog correctly updates or preserves Album A based on user choice
