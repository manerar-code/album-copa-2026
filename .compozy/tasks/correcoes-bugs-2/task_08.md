---
status: completed
title: "Fix onboarding layout overlaps and text truncation"
type: bugfix
complexity: low
dependencies: []
---

## Overview

The onboarding modal has four related layout bugs: the "Pular" button and "Passo X de 3" step indicator overlap slide content; and text at the bottom of slides (cycle legend, footer notes) is clipped by the action button. All four bugs share the same root cause — insufficient padding on the `topBar` and `content` containers — and are resolved by adjusting StyleSheet values in `OnboardingModal.tsx`.

<critical>
- Read the PRD (BUG-03, BUG-04, BUG-09, BUG-10) and TechSpec (Category 4 section) before starting.
- StyleSheet changes only — do NOT restructure the component hierarchy.
- Test all three onboarding slides after the change.
- Tests are required as part of this task.
</critical>

<requirements>
1. The `topBar` MUST have `paddingTop: 12` to separate it from the status bar area.
2. The `topBar` MUST have `paddingBottom: 12` (was 0) to create separation from slide content below.
3. The `topBar` MUST have `marginBottom: 8` for additional gap before the slide title.
4. The `content` area MUST have `paddingBottom: 16` to prevent bottom text from being clipped by the footer.
5. "Pular" and "Passo X de 3" MUST NOT visually overlap any slide title or body text.
6. The cycle legend "Falta → Tenho → Repetida → Falta" MUST be fully visible above the "Próximo" button.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] Open `OnboardingModal.tsx` and locate `topBar` and `content` StyleSheet entries
- [ ] Add `paddingTop: 12` and `paddingBottom: 12` to `topBar`
- [ ] Add `marginBottom: 8` to `topBar`
- [ ] Add `paddingBottom: 16` to `content`
- [ ] Test slide 1 ("Como marcar figurinhas") — "Pular" not overlapping title
- [ ] Test slide 2 ("Crie sua conta") — "Passo 2 de 3" not overlapping card content
- [ ] Test slide 3 ("Conheça o App") — cycle legend fully visible above "Concluir"

## Implementation Details

- `src/modules/onboarding/components/OnboardingModal.tsx` — `topBar` and `content` StyleSheet entries only
- See TechSpec "Category 4 — Onboarding Screen Layout" section and ADR-005

### Relevant Files
- `src/modules/onboarding/components/OnboardingModal.tsx` — only file to change

### Dependent Files
- No downstream task depends on this change

### Related ADRs
- [ADR-005](adrs/adr-005.md) — Onboarding fix via StyleSheet padding, no SafeAreaView refactor

## Deliverables

- All three onboarding slides render without overlapping elements
- Cycle legend fully visible on slide 1
- No text clipped below action buttons

## Tests

### Unit Tests
- [ ] `topBar` style has `paddingBottom >= 12`
- [ ] `topBar` style has `paddingTop >= 12`
- [ ] `topBar` style has `marginBottom >= 8`
- [ ] `content` style has `paddingBottom >= 16`

### Integration Tests
- [ ] OnboardingModal slide 1 renders "Pular" in topBar without overlapping "Como marcar figurinhas" title
- [ ] OnboardingModal slide 1 renders cycle legend text fully visible above "Próximo" button
- [ ] OnboardingModal slide 2 renders "Passo 2 de 3" without overlapping card items
- [ ] OnboardingModal slide 3 renders "Concluir" with all content above it visible

## Success Criteria

- All tests passing
- Test coverage >= 80% for OnboardingModal layout
- All three onboarding slides render cleanly on web app at 375px width
