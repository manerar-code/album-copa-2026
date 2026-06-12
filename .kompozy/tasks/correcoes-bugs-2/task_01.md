---
status: completed
title: "Expand TYPE_DISPLAY with all type label mappings"
type: bugfix
complexity: low
dependencies: []
---

## Overview

The `TYPE_DISPLAY` map in `userSettingsStore.ts` only maps `'Foil Player' → 'Brilhante'`, causing other types like `'Silver'`, `'foil'`, and `'silver'` to appear in raw form in filter chips and modals. This task adds all missing mappings so `displayType()` returns correct, capitalized labels for every type in the catalog.

<critical>
- Read the PRD (BUG-02) and TechSpec (BUG-02 section) before starting.
- Do NOT change the `displayType()` function logic — only add entries to `TYPE_DISPLAY`.
- Do NOT change internal type names stored in the database.
- Tests are required as part of this task.
</critical>

<requirements>
1. `TYPE_DISPLAY` MUST include entries for `'Foil Player'`, `'Silver'`, `'Player'`, `'foil'`, `'silver'`, and `'player'`.
2. `displayType('foil')` MUST return `'Brilhante'`.
3. `displayType('silver')` MUST return `'Silver'`.
4. `displayType('player')` MUST return `'Player'`.
5. `displayType('unknown_type')` MUST return `'unknown_type'` (passthrough for unmapped types).
6. No changes to `FIXED_TYPES` array or `displayType()` function signature.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Open `userSettingsStore.ts` and locate the `TYPE_DISPLAY` constant
- [ ] Add lowercase variant entries: `'foil'`, `'silver'`, `'player'`
- [ ] Add explicit capitalized entries: `'Silver'`, `'Player'`
- [ ] Verify `displayType()` passthrough still works for unmapped types
- [ ] Run web app and confirm filter chips show "Brilhante" and "Silver"

## Implementation Details

- `src/shared/store/userSettingsStore.ts` — only file to change
- See TechSpec "BUG-02" section for the complete `TYPE_DISPLAY` map

### Relevant Files
- `src/shared/store/userSettingsStore.ts` — `TYPE_DISPLAY`, `displayType()`
- `src/modules/album/screens/AlbumListScreen.tsx` — consumes `displayType()` for filter chips

### Dependent Files
- `task_03` (TypeSettingsModal fixes) depends on `displayType()` returning correct labels for all FIXED_TYPES

### Related ADRs
- [ADR-001](adrs/adr-001.md) — All fixes ship in one build

## Deliverables

- `TYPE_DISPLAY` map covers all known type variants
- Filter chips display "Brilhante" and "Silver" on the web app

## Tests

### Unit Tests
- [ ] `displayType('Foil Player')` returns `'Brilhante'`
- [ ] `displayType('foil')` returns `'Brilhante'`
- [ ] `displayType('Silver')` returns `'Silver'`
- [ ] `displayType('silver')` returns `'Silver'`
- [ ] `displayType('Player')` returns `'Player'`
- [ ] `displayType('player')` returns `'Player'`
- [ ] `displayType('McDonald')` returns `'McDonald'` (unmapped passthrough)

### Integration Tests
- [ ] AlbumListScreen filter chips render "Brilhante" when data contains type `'foil'`
- [ ] AlbumListScreen filter chips render "Silver" when data contains type `'silver'`

## Success Criteria

- All tests passing
- Test coverage >= 80% for `displayType()` and `TYPE_DISPLAY`
- No raw lowercase type strings visible in filter chips on the web app
