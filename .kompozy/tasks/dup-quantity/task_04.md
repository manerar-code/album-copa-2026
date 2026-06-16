---
status: completed
title: Update `DuplicatesScreen` with live quantity and share
type: frontend
complexity: medium
dependencies:
  - task_02
  - task_03
---

# Task 04: Update `DuplicatesScreen` with live quantity and share

## Overview

Replaces the hardcoded `dupCount={2}` in `DuplicatesScreen` with a live call to
`getDupCount(f.id)` from the store, passes `onPressDupBadge` to each duplicate `CromoCard`,
updates the total count to sum all quantities instead of counting unique sticker IDs, and
updates `handleShare` to append `×N` suffixes when quantity > 1.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Impact Analysis" row for DuplicatesScreen and "System Architecture" data flow
- FOCUS ON "WHAT" — three independent changes in one screen: dupCount, total, share text
- MINIMIZE CODE — each change is a one-line or small targeted edit
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST replace `dupCount={2}` with `dupCount={getDupCount(f.id)}` for every CromoCard in the screen
- MUST pass `onPressDupBadge={() => resetSticker(f.id)}` to every duplicate CromoCard
- MUST update total count: `total = sections.reduce((acc, s) => s.data.reduce((a, f) => a + getDupCount(f.id), acc), 0)`
- MUST update `handleShare` to append ` ×N` after `f.numero` when `getDupCount(f.id) > 1`
- MUST NOT show `×1` suffix in the share message (omit when quantity is exactly 1)
- MUST keep existing share message structure (header, team sections, footer) unchanged
- SHOULD subscribe to `quantities` from the store so the screen re-renders on quantity changes
</requirements>

## Subtasks

- [ ] 4.1 Subscribe to `getDupCount` and `resetSticker` from `useStickerStore`
- [ ] 4.2 Replace `dupCount={2}` with `dupCount={getDupCount(f.id)}` on the CromoCard
- [ ] 4.3 Add `onPressDupBadge={() => resetSticker(f.id)}` to the CromoCard
- [ ] 4.4 Update the `total` calculation to sum quantities across all stickers
- [ ] 4.5 Update `handleShare` sticker line to include ` ×N` suffix when quantity > 1
- [ ] 4.6 Write integration tests covering quantity display and share output

## Implementation Details

File to modify: `src/modules/duplicates/screens/DuplicatesScreen.tsx`

`getDupCount` and `resetSticker` are new actions from task_02. `onPressDupBadge` is the new
prop from task_03. The share formatter change is in `handleShare` — the sticker line currently
reads `` `  ${f.numero} · ${f.nome}` ``; update to include quantity suffix when > 1.

See TechSpec "System Architecture" section for the PRD share message format example.

### Relevant Files

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — file to modify
- `src/modules/album/store/stickerStore.ts` — source of `getDupCount`, `resetSticker`
- `src/shared/components/CromoCard.tsx` — receives `onPressDupBadge` (task_03)

### Dependent Files

- `src/tests/integration/DuplicatesScreen.test.tsx` — new or extended integration tests

### Related ADRs

- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Badge-tap wired here via `onPressDupBadge`

## Deliverables

- Modified `src/modules/duplicates/screens/DuplicatesScreen.tsx`
- `src/tests/integration/DuplicatesScreen.test.tsx` (new or extended)
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Integration tests:
  - [ ] Card with `quantities['fig-007'] = 3` renders `CromoCard` with `dupCount={3}` (shows `×3` badge)
  - [ ] Card with no quantity entry renders `CromoCard` with `dupCount={1}` (badge hidden)
  - [ ] Tapping the badge calls `resetSticker('fig-007')` — card is removed from duplicates section
  - [ ] Total displayed in screen header equals sum of all `getDupCount` values (e.g., 2+3=5, not 2)
  - [ ] WhatsApp share message includes ` ×3` after `BRA10` when `getDupCount('fig-bra-10') === 3`
  - [ ] WhatsApp share message does NOT include ` ×1` for a sticker with quantity 1
  - [ ] WhatsApp share total line reads `Total: 5 repetidas` when two stickers have quantities 2 and 3
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Hardcoded `dupCount={2}` is fully removed from the screen
- Share message matches the format defined in PRD "Core Features — Quantity in WhatsApp share"
- Total count in screen header and share footer are identical
