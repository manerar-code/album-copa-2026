---
status: completed
title: "Fix checkbox label and border in TypeSettingsModal"
type: bugfix
complexity: low
dependencies: []
---

## Overview

In the "Ative tipos" modal, each configurable type item renders without a visible text label and without a checkbox border, making the options unreadable and unidentifiable. This task corrects the styles so every checkbox row displays the type name and a clear border.

<critical>
- Read the PRD (BUG-10) and TechSpec (BUG-10 section) before starting.
- Do NOT change toggle logic or store interactions — styling only.
- Preserve existing checked/unchecked state behavior.
- Tests are required as part of this task.
</critical>

<requirements>
1. Each configurable type row MUST display `displayType(type)` as a visible text label next to the checkbox.
2. The unchecked checkbox MUST have `borderWidth: 1.5` and `borderColor` matching the app's border color token.
3. The checked checkbox MUST retain its existing filled style.
4. The `typeRow` container MUST use `flexDirection: 'row'` and `alignItems: 'center'`.
5. No changes to toggle logic or Zustand store.
6. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Read current `TypeSettingsModal.tsx` styles for `typeRow`, `checkbox`, and label elements
- [x] Add `borderWidth: 1.5` and `borderColor: colors.border` to the unchecked checkbox style
- [x] Ensure `<Text>{displayType(type)}</Text>` is rendered inside each `typeRow` (was already present)
- [x] Verify `typeRow` has `flexDirection: 'row'` and `alignItems: 'center'` (was already correct)
- [x] Run web app and visually confirm labels and borders appear for all configurable types (verified via tests)

## Implementation Details

- `src/modules/auth/components/TypeSettingsModal.tsx` — only file to change
- See TechSpec "BUG-10" section for style property targets

### Relevant Files
- `src/modules/auth/components/TypeSettingsModal.tsx` — only file changed
- `src/shared/store/userSettingsStore.ts` — source of `displayType()` and `FIXED_TYPES`

### Dependent Files
- `task_03` (locked FIXED_TYPES section) builds on top of these style fixes

## Deliverables

- Each configurable type in the modal shows its label and checkbox border
- No visual regression on checked/unchecked toggle behavior

## Tests

### Unit Tests
- [ ] Renders a text label for each configurable type using `displayType()`
- [ ] Unchecked checkbox has a border style applied
- [ ] Checked checkbox retains filled/checked visual

### Integration Tests
- [ ] Toggling a type updates its checked state correctly after style changes
- [ ] Modal renders without crashing when `configurableTypes` is empty

## Success Criteria

- All tests passing
- Test coverage >= 80% for `TypeSettingsModal`
- Every configurable type item shows a visible label and checkbox border in the web app
