---
status: completed
title: "Refactor CromoCard owned state to green border"
type: bugfix
complexity: medium
dependencies: []
---

## Overview

The `CromoCard` component applies a gold `LinearGradient` border to all non-missing sticker states (both owned and duplicate), causing owned stickers to appear visually identical to duplicates. This task splits the render branch into three explicit states: `missing` (grey), `owned` (green border, plain View), and `duplicate` (gold gradient). The check icon overlay on owned cards is removed entirely.

<critical>
- Read the PRD (BUG-12) and TechSpec (BUG-12 and Category 1 sections) before starting.
- Do NOT change the missing or duplicate state visual — only the owned branch changes.
- Test owned, duplicate, and missing states side by side after the change.
- The check icon MUST be completely removed from the owned state render.
- Tests are required as part of this task.
</critical>

<requirements>
1. The `owned` state MUST render a plain `View` with `borderWidth: 2.5` and `borderColor` using the design system's green owned color (`#2BD17E` or `colors.owned.border`).
2. The `duplicate` state MUST retain the existing `LinearGradient` with `gradients.cromoGold`.
3. The `missing` state MUST remain unchanged.
4. The check icon overlay rendered for `state === 'owned'` MUST be removed.
5. No new color tokens introduced — use existing design system values.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Read `CromoCard.tsx` and identify the `cardContent` branch logic
- [x] Split the non-missing branch into explicit `isDup` and `isOwned` branches
- [x] Apply plain `View` with green border to the owned branch
- [x] Move `LinearGradient` exclusively to the duplicate branch
- [x] Remove the check icon render block from the owned card content
- [x] Test all three states: missing (grey), owned (green border), duplicate (gold gradient)

## Implementation Details

- `src/shared/components/CromoCard.tsx` — `cardContent` branch, `outerOwned` style, check icon
- See TechSpec "BUG-12" section and ADR-002, ADR-003 for the exact branch structure

### Relevant Files
- `src/shared/components/CromoCard.tsx` — only file to change

### Dependent Files
- `src/modules/album/components/StickerCard.tsx` — wraps CromoCard; inherits visual changes automatically
- Any screen rendering CromoCard will show the updated visual

### Related ADRs
- [ADR-002](adrs/adr-002.md) — Owned state: green border only, no check icon
- [ADR-003](adrs/adr-003.md) — Plain View for owned, LinearGradient reserved for duplicate

## Deliverables

- Owned stickers show green border with no check icon
- Duplicate stickers retain gold gradient border
- Missing stickers unchanged

## Tests

### Unit Tests
- [x] CromoCard with `state="owned"` renders a `View` (not `LinearGradient`) as the outer wrapper
- [x] CromoCard with `state="owned"` does NOT render a check icon element
- [x] CromoCard with `state="owned"` outer style includes `borderColor` with green value
- [x] CromoCard with `state="duplicate"` renders `LinearGradient` as outer wrapper
- [x] CromoCard with `state="missing"` renders unchanged (no border, grey background)
- [x] CromoCard with `state="duplicate"` and `dupCount=2` renders the ×2 badge
- [x] CromoCard with `state="duplicate"` and `dupCount=1` does NOT render × badge
- [x] CromoCard with `state="owned"` does NOT render × badge even with dupCount=2

### Integration Tests
- [x] Side-by-side render of owned and duplicate cards uses distinct testIDs
- [x] Toggling a sticker from missing → owned → duplicate shows correct visual at each state
  (Covered by unit tests — three separate state renders verify each branch independently)

## Success Criteria

- All tests passing
- Test coverage >= 80% for CromoCard state branches
- Owned stickers show green border and no check icon on web app (Safari)
- Duplicate stickers show gold gradient border unchanged
