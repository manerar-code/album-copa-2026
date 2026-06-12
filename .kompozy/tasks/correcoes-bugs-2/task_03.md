---
status: completed
title: "Fix TypeSettingsModal deduplication and pre-marking"
type: bugfix
complexity: medium
dependencies: [task_01]
---

## Overview

The TypeSettingsModal shows duplicate type entries (because the DB may contain both `'Foil Player'` and `'foil'`) and FIXED_TYPES (Player, Brilhante, Silver) are not pre-marked when the modal opens for the first time. This task fixes the deduplication logic in the modal and ensures FIXED_TYPES are always included in the initial tracked state.

<critical>
- Read the PRD (BUG-05, BUG-11) and TechSpec (BUG-05 + BUG-11 section) before starting.
- Complete task_01 first — TYPE_DISPLAY must cover all types for labels to render correctly.
- Do NOT change FIXED_TYPES array — only fix filtering and initial state logic.
- Tests are required as part of this task.
</critical>

<requirements>
1. `configurableTypes` MUST filter out any type that matches a FIXED_TYPE case-insensitively.
2. Each type MUST appear exactly once in the modal (no duplicates between fixed and configurable sections).
3. FIXED_TYPES MUST be pre-marked (checked) when the modal opens, regardless of AsyncStorage state.
4. Every configurable type row MUST display its label via `displayType()` — no empty labels.
5. The `loadSettings` function in `userSettingsStore.ts` MUST always merge FIXED_TYPES into the loaded tracked types.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Update `configurableTypes` useMemo to use display-label comparison against FIXED_TYPES
- [x] Update `loadSettings` in `userSettingsStore.ts` to always merge FIXED_TYPES into loaded value
- [x] Verify FIXED_TYPES section renders locked rows with correct labels via `displayType()`
- [x] Verify configurable section has no overlap with FIXED_TYPES
- [x] Test modal with DB data containing both `'Foil Player'` and `'foil'` — confirm no duplicate

## Implementation Details

- `src/modules/auth/components/TypeSettingsModal.tsx` — `configurableTypes` useMemo
- `src/shared/store/userSettingsStore.ts` — `loadSettings` function
- See TechSpec "BUG-05 + BUG-11" section for the case-insensitive filter pattern and loadSettings fix

### Relevant Files
- `src/modules/auth/components/TypeSettingsModal.tsx` — configurableTypes, render logic
- `src/shared/store/userSettingsStore.ts` — loadSettings, FIXED_TYPES, setTrackedTypes

### Dependent Files
- Any screen that reads `trackedTypes` from the store will benefit from the pre-marking fix

### Related ADRs
- [ADR-001](adrs/adr-001.md) — All fixes ship in one build

## Deliverables

- TypeSettingsModal shows each type exactly once
- Player, Brilhante, Silver pre-marked on first open
- All labels visible for both fixed and configurable types

## Tests

### Unit Tests
- [x] `configurableTypes` excludes `'Foil Player'` when figurinhas contain `'Foil Player'`
- [x] `configurableTypes` excludes `'foil'` (lowercase) when FIXED_TYPES contains `'Foil Player'`
- [x] `configurableTypes` excludes `'silver'` (lowercase) when FIXED_TYPES contains `'Silver'`
- [x] `loadSettings` with empty AsyncStorage returns trackedTypes that includes all FIXED_TYPES
- [x] `loadSettings` with saved types always merges FIXED_TYPES into the result

### Integration Tests
- [x] TypeSettingsModal renders exactly 2 locked rows (Foil Player, Silver) when FIXED_TYPES has 2 entries
- [x] TypeSettingsModal renders no duplicate entries when figurinhas contain both `'Foil Player'` and `'foil'`
- [x] All locked type rows display non-empty labels

## Success Criteria

- All tests passing
- Test coverage >= 80% for TypeSettingsModal and loadSettings
- Modal shows each type once with correct labels on web app
