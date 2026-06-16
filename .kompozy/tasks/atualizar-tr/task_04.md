---
status: completed
title: DuplicatesScreen integration
type: frontend
complexity: low
dependencies:
  - task_03
---

# Task 04: DuplicatesScreen integration

## Overview

Wires `TradeRegistrationModal` into `DuplicatesScreen` by adding a visibility state, a "🤝 Registrar troca" button alongside the existing WhatsApp share button, and the modal render at the bottom of the screen component. This task is purely additive — no existing logic is changed.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Impact Analysis" section — this task is listed as "low risk — additive only"
- FOCUS ON "WHAT" — add the button and modal render; do not modify existing duplicate-listing logic
- MINIMIZE CODE — one `useState`, one button, one modal render
- TESTS REQUIRED — add a pure logic test verifying button visibility rule
</critical>

<requirements>
- 1. MUST add `tradeModalVisible` boolean state (default `false`) to DuplicatesScreen
- 2. MUST render a "🤝 Registrar troca" button in the screen header area, alongside the WhatsApp share button
- 3. MUST render `<TradeRegistrationModal visible={tradeModalVisible} onClose={() => setTradeModalVisible(false)} />` at the bottom of the component return
- 4. MUST NOT modify the existing SectionList, getDupCount, resetSticker, or share logic
- 5. SHOULD show the "Registrar troca" button whenever the screen is visible (not gated on duplicate count), per PRD Open Questions resolution: receiving always makes sense
</requirements>

## Subtasks

- [ ] 4.1 Import `TradeRegistrationModal` from `../components/TradeRegistrationModal`
- [ ] 4.2 Add `const [tradeModalVisible, setTradeModalVisible] = useState(false)` to DuplicatesScreen
- [ ] 4.3 Add "🤝 Registrar troca" button next to the WhatsApp share button in the header area
- [ ] 4.4 Render `<TradeRegistrationModal>` at the end of the component return, passing visibility state and onClose handler
- [ ] 4.5 Add a pure logic test for the button visibility rule

## Implementation Details

One file modified: `src/modules/duplicates/screens/DuplicatesScreen.tsx`

Read the current button/header layout to determine placement. The WhatsApp share button is rendered via `handleShare`. Place the "🤝 Registrar troca" button as a sibling in the same container (row layout). Keep styling consistent with the existing button style.

See PRD "Core Features — 1. Register Trade button" section for button label and placement description.

### Relevant Files

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — the only file modified
- `src/modules/duplicates/components/TradeRegistrationModal.tsx` — (Task 03) imported here
- `src/tests/integration/DuplicatesScreen.test.tsx` — existing test file; add the new test case here

### Dependent Files

- No downstream files depend on this task

### Related ADRs

- [ADR-001: Modal Único com Dois Campos](adrs/adr-001.md) — button on DuplicatesScreen is the entry point defined by this product decision

## Deliverables

- `src/modules/duplicates/screens/DuplicatesScreen.tsx` — updated with button and modal render
- New test case in `src/tests/integration/DuplicatesScreen.test.tsx`

## Tests

- Unit tests:
  - [ ] Button visibility: "🤝 Registrar troca" button is always rendered on the Duplicates screen (not conditional on duplicate count)
- Integration tests: N/A — additive UI wiring; store behavior covered by Task 02 tests
- Test coverage target: >=80% for the modified DuplicatesScreen logic
- All tests must pass

## Success Criteria

- All tests passing
- "🤝 Registrar troca" button renders on the Duplicates screen
- Tapping the button sets `tradeModalVisible` to true (verified visually or via state inspection)
- `TradeRegistrationModal` closes and returns to Duplicates screen after confirming or cancelling a trade
- No regressions in existing share, reset, or toggle flows on the Duplicates screen
- TypeScript strict mode passes with no errors or `any`
