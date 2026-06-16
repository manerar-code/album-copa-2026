---
status: completed
title: TradeRegistrationModal component
type: frontend
complexity: medium
dependencies:
  - task_01
  - task_02
---

# Task 03: TradeRegistrationModal component

## Overview

Creates `TradeRegistrationModal.tsx` in `src/modules/duplicates/components/`. The modal presents two multiline text fields ("Enviei" and "Recebi"), a summary line showing parsed counts, and Confirmar/Cancelar buttons. On confirm it calls `registerTrade(sentIds, receivedIds)` and closes. This is the only UI surface for the feature; no screen changes are required by this task.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "System Architecture" and "Core Interfaces" sections for component boundaries
- FOCUS ON "WHAT" — a modal form that parses text and calls registerTrade; not responsible for how parsing works
- MINIMIZE CODE — follow HelpModal's bottom-sheet pattern (transparent overlay, slide animation, sheet)
- TESTS REQUIRED — modal component is not rendered in tests (see DuplicatesScreen.test.tsx precedent); tests go in the resolveEntries and registerTrade tasks
</critical>

<requirements>
- 1. MUST accept `{ visible: boolean; onClose: () => void }` props only
- 2. MUST use React Native `Modal` with `transparent` and `animationType="slide"` (bottom sheet pattern)
- 3. MUST wrap content in `KeyboardAvoidingView` to handle TextInput focus on iOS
- 4. MUST call `parseTradeList` on both fields and pass results through `resolveEntries` to get `sentIds[]` and `receivedIds[]`
- 5. MUST display summary line: `"${sentIds.length} enviadas · ${receivedIds.length} recebidas"` when at least one field has parseable content
- 6. MUST disable Confirmar button when both `sentIds.length === 0` and `receivedIds.length === 0`
- 7. MUST call `registerTrade(sentIds, receivedIds)` and then `onClose()` on confirm
- 8. MUST show loading state on the Confirmar button while `registerTrade` is executing
- 9. MUST reset both text fields to empty when modal closes (`visible` changes to false)
- 10. MUST use theme tokens from `@core/theme` for all colors, spacing, and radii — no hardcoded values
- 11. MUST call `text.toUpperCase()` on `onChangeText` for both fields (same as TradesScreen)
</requirements>

## Subtasks

- [ ] 3.1 Create `src/modules/duplicates/components/TradeRegistrationModal.tsx` with props interface and bottom-sheet skeleton
- [ ] 3.2 Add "Enviei" multiline TextInput with uppercase transform
- [ ] 3.3 Add "Recebi" multiline TextInput with uppercase transform
- [ ] 3.4 Derive `sentIds` and `receivedIds` with `useMemo` from both text field values
- [ ] 3.5 Add summary line (hide when both fields empty/unparseable)
- [ ] 3.6 Add Confirmar button (disabled + loading states) and Cancelar button
- [ ] 3.7 Wire confirm handler: call `registerTrade`, then `onClose`

## Implementation Details

One new file: `src/modules/duplicates/components/TradeRegistrationModal.tsx`

Follow the bottom-sheet pattern from `src/shared/components/HelpModal.tsx`: outer TouchableOpacity overlay with `backgroundColor: 'rgba(0,0,0,0.5)'` and `justifyContent: 'flex-end'`, inner sheet with `borderTopLeftRadius` / `borderTopRightRadius`, `maxHeight: '80%'`, `flexShrink: 1`.

Use `GoldButton` from `src/shared/components/GoldButton.tsx` for the Confirmar button (supports `loading` and `disabled` props). Use a plain `TouchableOpacity` for Cancelar.

Import `figurinhas` and `selecoes` from `useStickerStore` to pass to `resolveEntries`. Use `useShallow` for the stable references.

The `sentIds` / `receivedIds` derivation in `useMemo`:
```
parseTradeList(sentText).entries → resolveEntries(entries, figurinhas, selecoes)
```

See TechSpec "Core Interfaces" and PRD "Trade Registration modal" section.

### Relevant Files

- `src/shared/components/HelpModal.tsx` — bottom sheet modal pattern to follow
- `src/modules/auth/components/ProfileModal.tsx` — example of modal with TextInput + KeyboardAvoidingView
- `src/modules/trades/screens/TradesScreen.tsx` — TextInput pattern with `toUpperCase()` and `parseTradeList` usage
- `src/modules/trades/utils/parseTradeList.ts` — import `parseTradeList` and `ParsedEntry` from here
- `src/modules/duplicates/utils/resolveEntries.ts` — (Task 01) import `resolveEntries` from here
- `src/shared/components/GoldButton.tsx` — use for Confirmar button
- `src/core/theme/index.ts` — colors, spacing, radius tokens

### Dependent Files

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — (Task 04) renders this modal

### Related ADRs

- [ADR-001: Modal Único com Dois Campos](adrs/adr-001.md) — two-field modal is the chosen product approach
- [ADR-003: TradeRegistrationModal co-located in duplicates/components](adrs/adr-003.md) — establishes file location

## Deliverables

- `src/modules/duplicates/components/TradeRegistrationModal.tsx` — fully functional modal component

## Tests

- Unit tests: N/A — modal rendering tests are skipped per project precedent (see `DuplicatesScreen.test.tsx` which uses pure logic tests only due to react-native mock complexity)
- Integration tests: N/A — covered by Task 02 store integration tests
- Test coverage target: N/A for this component file; coverage for the logic it depends on is in Tasks 01 and 02
- All tests must pass (Tasks 01 and 02 tests must pass before this task is complete)

## Success Criteria

- Modal renders without TypeScript errors in strict mode
- Confirmar button is disabled when both fields are empty
- Confirmar button shows loading state during `registerTrade` execution
- Both text fields reset to empty when `visible` becomes false
- Theme tokens used throughout — no hardcoded hex colors or pixel values
