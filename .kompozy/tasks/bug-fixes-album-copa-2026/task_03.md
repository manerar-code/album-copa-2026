---
status: completed
title: "Add locked FIXED_TYPES section to TypeSettingsModal"
type: bugfix
complexity: low
dependencies: [task_02]
---

## Overview

Player, Brilhante (Foil Player), and Silver are mandatory sticker types that must always be tracked. Currently they are enforced silently in the store but invisible to the user in the modal. This task adds a locked, non-interactive section at the top of the modal displaying these types with a visual locked state.

<critical>
- Read the PRD (BUG-09) and TechSpec (BUG-09 section) before starting.
- Complete task_02 first — checkbox styles must be correct before adding the locked section.
- Do NOT make FIXED_TYPES toggleable — they must remain non-interactive.
- Do NOT change store logic in `userSettingsStore.ts` — UI change only.
- Tests are required as part of this task.
</critical>

<requirements>
1. FIXED_TYPES MUST appear at the top of the type list, before configurable types.
2. Each FIXED_TYPE row MUST display a checked checkbox, the type label via `displayType()`, and a lock icon (🔒).
3. FIXED_TYPE checkboxes MUST NOT respond to touch events.
4. FIXED_TYPE rows MUST have a visually distinct locked style (e.g., `opacity: 0.6` on the checkbox).
5. A visual divider MUST separate the locked section from the configurable section.
6. No changes to `userSettingsStore.ts` or toggle logic.
</requirements>

## Subtasks

- [ ] Import `FIXED_TYPES` and `displayType` into `TypeSettingsModal.tsx`
- [ ] Render a locked row for each item in `FIXED_TYPES` above the configurable list
- [ ] Add `checkboxLocked` style (`opacity: 0.6`, no touch handler)
- [ ] Add lock icon (🔒) to each locked row
- [ ] Add a `<View style={styles.divider} />` between locked and configurable sections
- [ ] Run web app and confirm locked types appear first and are non-interactive

## Implementation Details

- `src/modules/auth/components/TypeSettingsModal.tsx` — only file to change
- Import `FIXED_TYPES` from `src/shared/store/userSettingsStore.ts`
- See TechSpec "BUG-09" section for the locked row JSX pattern and ADR-004

### Relevant Files
- `src/modules/auth/components/TypeSettingsModal.tsx` — file to modify
- `src/shared/store/userSettingsStore.ts` — source of `FIXED_TYPES` and `displayType()`

### Dependent Files
- No downstream task depends on this file

### Related ADRs
- [ADR-004](adrs/adr-004.md) — FIXED_TYPES rendered as locked rows at top of modal

## Deliverables

- Locked section with Player, Brilhante, Silver at the top of the type modal
- Locked rows are non-interactive and visually distinct
- Divider between locked and configurable sections

## Tests

### Unit Tests
- [ ] Renders exactly 3 locked rows (Player, Brilhante, Silver) at the top
- [ ] Locked rows display correct labels via `displayType()`
- [ ] Locked rows do not respond to touch/press events
- [ ] Configurable types still render below the divider

### Integration Tests
- [ ] Modal renders without crashing after adding locked section
- [ ] Toggling a configurable type does not affect locked type state

## Success Criteria

- All tests passing
- Test coverage >= 80% for `TypeSettingsModal`
- Player, Brilhante, Silver appear locked at the top of the modal in the web app
