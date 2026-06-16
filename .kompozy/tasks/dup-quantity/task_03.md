---
status: completed
title: Add `onPressDupBadge` prop to `CromoCard`
type: frontend
complexity: low
dependencies: []
---

# Task 03: Add `onPressDupBadge` prop to `CromoCard`

## Overview

Adds an optional `onPressDupBadge?: () => void` prop to `CromoCard` and wraps the `×N` badge
in a `TouchableOpacity` when the callback is provided. This makes the badge an independent
touch target so callers can reset a sticker to `missing` without affecting the card body tap.
All existing callers remain unaffected because the prop is optional.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Core Interfaces" section for the new prop definition
- FOCUS ON "WHAT" — add the prop and wire the TouchableOpacity; do not change badge styling
- MINIMIZE CODE — one new prop, one conditional TouchableOpacity around the existing badge
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `onPressDupBadge?: () => void` to `CromoCardProps`
- MUST wrap the badge `LinearGradient` in a `TouchableOpacity` when `onPressDupBadge` is defined
- MUST keep badge invisible when `dupCount <= 1` (existing behaviour unchanged)
- MUST use `activeOpacity={0.75}` for the badge TouchableOpacity (matches card body style)
- MUST ensure badge touch target is at minimum 28×28 pt (use padding or minWidth/minHeight)
- MUST NOT break existing callers that pass only `onPress` (card body handler)
- MUST NOT render a TouchableOpacity around the badge when `onPressDupBadge` is undefined
</requirements>

## Subtasks

- [ ] 3.1 Add `onPressDupBadge?: () => void` to the `CromoCardProps` interface
- [ ] 3.2 Conditionally wrap the badge `LinearGradient` in `TouchableOpacity` when prop is defined
- [ ] 3.3 Ensure touch target size meets 28×28 pt minimum via style
- [ ] 3.4 Write unit tests confirming badge press calls `onPressDupBadge` and card press calls `onPress` independently

## Implementation Details

File to modify: `src/shared/components/CromoCard.tsx`

The badge is rendered at lines ~139–149 inside the `isDup` branch. Currently it is a plain
`LinearGradient`. Wrap it: when `onPressDupBadge` is provided, replace the root element with
`TouchableOpacity` containing the existing `LinearGradient`; when not provided, keep as-is.

See TechSpec "Core Interfaces — New CromoCardProps callback" for the exact prop name and type.

### Relevant Files

- `src/shared/components/CromoCard.tsx` — file to modify (badge at lines ~139–149)

### Dependent Files

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — task_04 passes `onPressDupBadge`
- `src/modules/album/components/StickerCard.tsx` — task_05 passes `onPressDupBadge`
- `src/tests/integration/TradesScreen.test.tsx` — uses CromoCard mock; verify mock still works

### Related ADRs

- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Badge-tap-to-reset is the UX pattern this prop enables

## Deliverables

- Modified `src/shared/components/CromoCard.tsx`
- Unit tests for `onPressDupBadge` behaviour in `src/tests/unit/CromoCard.test.tsx` (new or extended)
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Pressing the badge calls `onPressDupBadge` and does NOT call `onPress`
  - [ ] Pressing the card body calls `onPress` and does NOT call `onPressDupBadge`
  - [ ] Badge is not rendered when `dupCount` is 1 (existing behaviour)
  - [ ] Badge is not rendered when `dupCount` is 0 (existing behaviour)
  - [ ] Badge renders with `×3` text when `dupCount={3}` and `onPressDupBadge` is provided
  - [ ] No `TouchableOpacity` wraps the badge when `onPressDupBadge` is undefined (badge is non-interactive)
- Integration tests:
  - [ ] Existing `TradesScreen` integration test still passes with updated `CromoCard` (badge prop is optional)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- No existing caller of `CromoCard` requires changes (prop is optional, defaults to undefined)
- Badge touch target is reachable on a 375 pt wide screen without overlapping the card body tap area
