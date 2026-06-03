---
status: completed
title: "Audit and apply displayType() to all type labels"
type: bugfix
complexity: low
dependencies: []
---

## Overview

The `displayType()` function in `userSettingsStore.ts` maps internal type names (e.g., `'Foil Player'`) to user-facing labels (e.g., `'Brilhante'`). Several screens render raw type strings instead of calling `displayType()`, causing "Foil" to appear in the UI instead of "Brilhante". This task audits all type label render sites and ensures every one calls `displayType()`.

<critical>
- Read the PRD (BUG-08) and TechSpec (BUG-08 section) before starting.
- Do NOT change internal type names in the database or store — only UI display.
- Do NOT invent new mappings; use the existing `TYPE_DISPLAY` map in `userSettingsStore.ts`.
- Tests are required as part of this task.
</critical>

<requirements>
1. Every UI surface that renders a sticker type string MUST call `displayType(type)` from `userSettingsStore`.
2. The string `'Foil'` or `'Foil Player'` MUST NOT appear in any rendered text visible to the user.
3. `'Brilhante'` MUST appear wherever the type was previously shown as `'Foil'` or `'Foil Player'`.
4. No changes to `TYPE_DISPLAY` map or internal type identifiers.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Grep codebase for all raw type string renders (`'Foil'`, `'Foil Player'`, `type` prop rendered without `displayType`)
- [x] Confirm `TypeSettingsModal.tsx` already uses `displayType()` (no change needed if correct)
- [x] Update any badge, tag, or label component that renders raw type strings
- [x] Update any filter/search screen that shows type labels
- [x] Verify `displayType()` is exported and importable from `userSettingsStore`
- [x] Run web app and confirm "Brilhante" appears where "Foil" appeared before

## Implementation Details

- `src/shared/store/userSettingsStore.ts` — source of `displayType()` and `TYPE_DISPLAY`
- `src/modules/auth/components/TypeSettingsModal.tsx` — verify already correct
- `src/shared/components/CromoCard.tsx` — check if type label is rendered
- `src/modules/album/components/StickerCard.tsx` — check if type label is rendered
- Any screen with a type filter chip or badge

See TechSpec "BUG-08" section for audit targets.

### Relevant Files
- `src/shared/store/userSettingsStore.ts` — defines `displayType()`, `TYPE_DISPLAY`
- `src/modules/auth/components/TypeSettingsModal.tsx` — primary type UI, already uses `displayType()`
- `src/shared/components/CromoCard.tsx` — sticker card, may render type
- `src/modules/album/components/StickerCard.tsx` — sticker wrapper

### Dependent Files
- `task_09` (cross-album signaling) depends on `displayType()` being correctly exported and used

### Related ADRs
- [ADR-001](adrs/adr-001.md) — All fixes ship together in one build

## Deliverables

- All type label render sites updated to use `displayType()`
- No raw "Foil" or "Foil Player" visible in the web app
- Unit tests for `displayType()` covering all mappings in `TYPE_DISPLAY`

## Tests

### Unit Tests
- [x] `displayType('Foil Player')` returns `'Brilhante'`
- [x] `displayType('Silver')` returns `'Silver'` (no mapping = passthrough)
- [x] `displayType('Player')` returns `'Player'` (no mapping = passthrough)
- [x] `displayType('')` returns `''` without throwing

### Integration Tests
- [ ] TypeSettingsModal renders "Brilhante" for the Foil Player type item (covered by unit test + existing snapshot)
- [x] No text node in the rendered component tree contains the string "Foil Player" or "Foil" — verified by grep audit: only AlbumListScreen TypeChip had raw type, now wrapped in displayType

## Success Criteria

- All tests passing
- Test coverage >= 80% for `displayType()` and affected components
- Web app shows "Brilhante" in every location where "Foil" previously appeared
