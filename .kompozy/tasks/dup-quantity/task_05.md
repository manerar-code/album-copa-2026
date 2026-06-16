---
status: completed
title: Wire `onPressDupBadge` in `StickerCard` and album screens
type: frontend
complexity: low
dependencies:
  - task_02
  - task_03
---

# Task 05: Wire `onPressDupBadge` in `StickerCard` and album screens

## Overview

Passes `onPressDupBadge={() => resetSticker(figurinhaId)}` to the `CromoCard` inside
`StickerCard` (and any album-grid screens that render `CromoCard` directly) so that badge-tap
resets work from the main album view — not just from the Duplicates screen. Also passes
`dupCount={getDupCount(figurinhaId)}` so the badge count is accurate in the album grid.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Impact Analysis" rows for album grid / team screens
- FOCUS ON "WHAT" — pass two props to an existing CromoCard render; no logic changes
- MINIMIZE CODE — targeted prop additions only; no new components or screens
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST pass `dupCount={getDupCount(figurinhaId)}` to the `CromoCard` inside `StickerCard`
- MUST pass `onPressDupBadge={() => resetSticker(figurinhaId)}` to the `CromoCard` inside `StickerCard` when `state === 'duplicate'`
- MUST NOT pass `onPressDupBadge` when sticker state is `missing` or `owned` (badge is not shown anyway, but prop should be absent for clarity)
- MUST source `getDupCount` and `resetSticker` from `useStickerStore` (task_02)
- MUST NOT change the `onPress` / `toggleSticker` tap behaviour of the card body
</requirements>

## Subtasks

- [ ] 5.1 Subscribe to `getDupCount` and `resetSticker` from `useStickerStore` in `StickerCard`
- [ ] 5.2 Pass `dupCount={getDupCount(figurinhaId)}` to `CromoCard`
- [ ] 5.3 Conditionally pass `onPressDupBadge={() => resetSticker(figurinhaId)}` when `status === 'duplicate'`
- [ ] 5.4 Verify no other screens render `CromoCard` with `state="duplicate"` directly (from exploration: only `DuplicatesScreen` does — task_04 covers it)
- [ ] 5.5 Write unit tests for `StickerCard` confirming badge press triggers `resetSticker`

## Implementation Details

File to modify: `src/modules/album/components/StickerCard.tsx`

`StickerCard` already calls `toggleSticker` on card-body press and passes `state={status}` to
`CromoCard`. Add the two new props. `getDupCount` and `resetSticker` are available from
`useStickerStore` after task_02.

From codebase exploration: only `DuplicatesScreen` renders `CromoCard` with `state="duplicate"`
directly (handled in task_04). `StickerCard` is the wrapper used in album grid views.

### Relevant Files

- `src/modules/album/components/StickerCard.tsx` — primary file to modify
- `src/modules/album/store/stickerStore.ts` — source of `getDupCount`, `resetSticker` (task_02)
- `src/shared/components/CromoCard.tsx` — receives the new props (task_03)

### Dependent Files

- Any screen that renders `StickerCard` (album list, team screens) — no changes needed in those screens; `StickerCard` is the integration point

### Related ADRs

- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Badge-tap reset wired at the `StickerCard` level here

## Deliverables

- Modified `src/modules/album/components/StickerCard.tsx`
- Unit tests for the new props in `src/tests/unit/StickerCard.test.tsx` (new or extended)
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `StickerCard` with `status='duplicate'` and `quantities['fig-007'] = 2` renders `CromoCard` with `dupCount={2}`
  - [ ] `StickerCard` with `status='duplicate'` and no quantities entry renders `CromoCard` with `dupCount={1}`
  - [ ] Pressing the badge on a `duplicate` StickerCard calls `resetSticker('fig-007')` and does NOT call `toggleSticker`
  - [ ] Pressing the card body on a `duplicate` StickerCard calls `toggleSticker` (increments count) and does NOT call `resetSticker`
  - [ ] `StickerCard` with `status='owned'` does NOT pass `onPressDupBadge` to `CromoCard`
  - [ ] `StickerCard` with `status='missing'` does NOT pass `onPressDupBadge` to `CromoCard`
- Integration tests:
  - [ ] (Covered by album-grid screen tests if they exist; no standalone integration test required)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Badge-tap reset works from the album grid view without navigating to the Duplicates screen
- Card-body tap still increments the duplicate count (calls `toggleSticker` via existing path)
