---
status: completed
title: "Replace Faltantes tab icon with magnifying glass"
type: bugfix
complexity: low
dependencies: []
---

## Overview

The "Faltantes" tab in the bottom navigation bar displays a ❌ (red X) emoji, which communicates deletion or error rather than searching for missing stickers. This task replaces it with 🔍 (magnifying glass) to match the screen's purpose.

<critical>
- Read the PRD (BUG-08) and TechSpec (BUG-08 section) before starting.
- One-line change in `tabIcons` map — do NOT change tab label, screen, or navigation logic.
- Tests are required as part of this task.
</critical>

<requirements>
1. The `tabIcons` map in `RootNavigator.tsx` MUST have `Missing: '🔍'`.
2. The tab label "Faltantes" MUST remain unchanged.
3. No other tab icons MUST be modified.
4. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Open `RootNavigator.tsx` and locate the `tabIcons` map
- [x] Change `Missing: '❌'` to `Missing: '🔍'`
- [x] Verify the change does not affect tab label or navigation
- [x] Confirm all other tab icons are unchanged

## Implementation Details

- `src/core/navigation/RootNavigator.tsx` — `tabIcons` map, one character change
- See TechSpec "BUG-08" section and ADR-004

### Relevant Files
- `src/core/navigation/RootNavigator.tsx` — only file to change

### Dependent Files
- No downstream task depends on this change

### Related ADRs
- [ADR-004](adrs/adr-004.md) — Faltantes tab uses 🔍

## Deliverables

- Faltantes tab shows 🔍 in the bottom navigation bar

## Tests

### Unit Tests
- [x] `tabIcons['Missing']` equals `'🔍'`
- [x] `tabIcons['Home']` equals `'🏠'` (unchanged)
- [x] `tabIcons['Album']` equals `'📖'` (unchanged)
- [x] `tabIcons['Duplicates']` equals `'🔄'` (unchanged)
- [x] `tabIcons['Stats']` equals `'📊'` (unchanged)

### Integration Tests
- [ ] Bottom tab bar renders 🔍 for the Faltantes tab (requires full render with real navigation)
- [ ] Tapping the Faltantes tab still navigates to the MissingScreen (requires full render with real navigation)

## Success Criteria

- All tests passing
- Faltantes tab displays 🔍 on web app (Safari)
