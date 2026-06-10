---
status: completed
title: "Apply Zustand field selectors in 5 store consumers"
type: refactor
complexity: medium
dependencies:
  - task_22
---

# Apply Zustand field selectors in 5 store consumers


## Overview

Five components destructure the full `useStickerStore()` without field selectors. In Zustand, a component that subscribes to the full store re-renders on every state change — including unrelated fields. When a user marks a sticker, every component in this list re-renders. Replacing full destructuring with per-field selectors limits re-renders to only the fields each component actually reads.

<critical>
- ALWAYS READ the PRD (F3.7) and TechSpec "Phase 3, step 27" before starting
- FOCUS ON "WHAT" — replace full store destructuring with field-level selectors
- MINIMIZE CODE — targeted selector replacements; do not restructure components
- TESTS REQUIRED — verify render count reduction per component
</critical>

<requirements>
1. `StickerCard.tsx` MUST use individual selectors for each field it reads from `useStickerStore`.
2. `ScreenHeader.tsx` MUST use individual selectors for `userAlbums` and `activeUserAlbumId`.
3. `HomeScreen.tsx` MUST use individual selectors for `selecoes`, `figurinhas`, `collection`, `applyCollection`, `activeUserAlbumId`, `isInitialized`.
4. `AlbumListScreen.tsx` MUST use individual selectors (in addition to task_22 memoization).
5. `UserAlbumsModal.tsx` MUST use individual selectors for its 7 consumed fields.
6. For components reading 3+ fields, `useShallow` from `zustand/react/shallow` MAY be used to batch selectors.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 23.1 Update `StickerCard.tsx` to use field selectors for each store value it reads
- [ ] 23.2 Update `ScreenHeader.tsx` to use field selectors
- [ ] 23.3 Update `HomeScreen.tsx` to use field selectors or `useShallow`
- [ ] 23.4 Update `AlbumListScreen.tsx` to use field selectors (depends on task_22)
- [ ] 23.5 Update `UserAlbumsModal.tsx` to use field selectors or `useShallow`
- [ ] 23.6 Verify no component re-renders when an unrelated store field changes

## Implementation Details

Five files: `StickerCard.tsx`, `ScreenHeader.tsx`, `HomeScreen.tsx`, `AlbumListScreen.tsx`, `UserAlbumsModal.tsx`. See TechSpec "Phase 3, step 27" and PRD F3.7 for the selector pattern. Depends on task_22 (AlbumListScreen must be finalized first).

### Relevant Files
- `src/modules/album/components/StickerCard.tsx`
- `src/shared/components/ScreenHeader.tsx`
- `src/modules/dashboard/screens/HomeScreen.tsx`
- `src/modules/album/screens/AlbumListScreen.tsx`
- `src/modules/auth/components/UserAlbumsModal.tsx`

### Dependent Files
- `src/modules/album/store/stickerStore.ts` — no changes needed; selectors are call-site changes only

## Deliverables

- All 5 components updated with field selectors
- Unit tests confirming re-render reduction

## Tests

### Unit Tests
- [ ] `ScreenHeader` does NOT re-render when `collection` changes (only subscribes to `userAlbums` and `activeUserAlbumId`)
- [ ] `StickerCard` with figurinhaId X does NOT re-render when figurinhaId Y's status changes
- [ ] `UserAlbumsModal` does NOT re-render when `collection` changes (only subscribes to album-level fields)

### Integration Tests
- [ ] Marking a sticker on AlbumListScreen does NOT trigger re-render of ScreenHeader
- [ ] Opening UserAlbumsModal renders correctly with current album list

## Success Criteria

- All tests passing
- Test coverage >= 80% for selector usage in each component
- Unnecessary re-renders eliminated on sticker tap
