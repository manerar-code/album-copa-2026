---
status: completed
title: "Optimize AlbumListScreen FlatList with getItemLayout + useCallback"
type: refactor
complexity: medium
dependencies: []
---

# Optimize AlbumListScreen FlatList with getItemLayout + useCallback


## Overview

`AlbumListScreen` renders a FlatList without `getItemLayout`, forcing React Native to measure every item's height during scroll — causing jank on long lists (32+ teams). `renderItem` and `getTeamStats` are also recreated inline on every render, forcing all visible items to re-render whenever any sticker state changes. Adding `getItemLayout` and memoizing the callbacks reduces scroll jank and eliminates redundant renders.

<critical>
- ALWAYS READ the PRD (F3.6) and TechSpec "Phase 3, step 26" before starting
- FOCUS ON "WHAT" — fixed-height items + stable callback references
- MINIMIZE CODE — measure one item height, add getItemLayout + useCallback/useMemo wrappers
- TESTS REQUIRED — verify render count reduction and correct item layout
</critical>

<requirements>
1. FlatList MUST add `getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}`.
2. `ITEM_HEIGHT` MUST be measured from the current item styles and defined as a constant.
3. `renderItem` MUST be wrapped in `useCallback` with dependencies that only include values it reads.
4. `getTeamStats` (or equivalent stats computation) MUST be wrapped in `useMemo` or `useCallback`.
5. The `filtered` teams array MUST be derived with `useMemo` (already filtering — ensure it is memoized).
6. Visual output MUST be identical to the current implementation.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 22.1 Measure the rendered height of a single team row item and define `ITEM_HEIGHT` constant
- [ ] 22.2 Add `getItemLayout` to the FlatList using the constant
- [ ] 22.3 Wrap `renderItem` function in `useCallback`
- [ ] 22.4 Wrap `getTeamStats` / stats computation in `useCallback` or `useMemo`
- [ ] 22.5 Wrap `filtered` derivation in `useMemo`
- [ ] 22.6 Verify scroll performance on web (no visible jank on rapid scroll)

## Implementation Details

Modify `src/modules/album/screens/AlbumListScreen.tsx` only. See TechSpec "Phase 3, step 26" for the optimization pattern.

### Relevant Files
- `src/modules/album/screens/AlbumListScreen.tsx` — FlatList, renderItem, getTeamStats, filtered

### Dependent Files
- `task_23` (Zustand selectors) — modifies the same file; complete task_22 first

## Deliverables

- `AlbumListScreen.tsx` with optimized FlatList
- Unit tests for getItemLayout and memoization

## Tests

### Unit Tests
- [ ] `getItemLayout(null, 0)` returns `{ length: ITEM_HEIGHT, offset: 0, index: 0 }`
- [ ] `getItemLayout(null, 5)` returns `{ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * 5, index: 5 }`
- [ ] `renderItem` reference is stable when `filtered` is unchanged (useCallback check)
- [ ] `filtered` reference is stable when `selecoes` and `search` are unchanged (useMemo check)

### Integration Tests
- [ ] AlbumListScreen scrolls smoothly on web with 32+ team items
- [ ] Tapping a team navigates to TeamDetail screen (no regression)

## Success Criteria

- All tests passing
- FlatList scroll performance >= 60 FPS on iPhone SE (375px)
- No visual regression in team list rendering
