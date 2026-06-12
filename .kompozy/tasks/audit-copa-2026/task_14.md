---
status: completed
title: "F11 — Extração do ProfileModal do RootNavigator"
type: refactor
complexity: medium
dependencies:
    - task_05
    - task_09
---

# Task 14: F11 — Extração do ProfileModal do RootNavigator

## Overview

Extrai o modal de perfil do usuário (avatar, edição de nickname, sair da conta, links para TypeSettingsModal e PrivacyPolicyModal) do código inline do `RootNavigator.tsx` para um componente standalone `ProfileModal.tsx`. Após a extração, o `RootNavigator` deve ter ≤ 100 linhas e cobrir apenas estrutura de navegação.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 4 — F11 — ProfileModal Extraction" for the component interface and the target state of RootNavigator
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `src/modules/auth/components/ProfileModal.tsx` with all state variables and handlers currently inline in `RootNavigator` (profileVisible, typeSettingsVisible, editing, nickname, saving, handleSaveNickname, handleSignOut, etc.)
- MUST include props: `visible: boolean`, `onClose: () => void`, `onOpenPrivacyPolicy: () => void`
- MUST move the deletion button (testID="request-deletion-btn") and `AccountDeletionModal` trigger from RootNavigator's inline code into `ProfileModal`
- MUST move `TypeSettingsModal` trigger and rendering into `ProfileModal`
- MUST render `<PrivacyPolicyModal>` from within `ProfileModal` (triggered by "Política de Privacidade" button), using the `onOpenPrivacyPolicy` prop or internal state
- MUST update `RootNavigator.tsx` to use `<ProfileModal visible={profileVisible} onClose={...} onOpenPrivacyPolicy={...} />` — no inline modal JSX
- RootNavigator.tsx target: ≤ 100 lines after extraction
- MUST verify all existing ProfileModal test behaviors still pass (nickname edit, sign out, TypeSettings)
- SHOULD NOT change any user-visible behavior
</requirements>

## Subtasks

- [ ] 14.1 Create `src/modules/auth/components/ProfileModal.tsx` with the ProfileModalProps interface
- [ ] 14.2 Move all profile-related local state and handlers from RootNavigator into ProfileModal
- [ ] 14.3 Move TypeSettingsModal trigger and rendering into ProfileModal
- [ ] 14.4 Move AccountDeletionModal trigger and deletion button (from task_09) into ProfileModal
- [ ] 14.5 Add "Política de Privacidade" button in ProfileModal that triggers PrivacyPolicyModal
- [ ] 14.6 Update RootNavigator to use the extracted ProfileModal component; verify line count ≤ 100

## Implementation Details

See TechSpec section "Phase 4 — F11 — ProfileModal Extraction" for the component interface and RootNavigator target structure.

The current RootNavigator has these state variables to move: `profileVisible`, `typeSettingsVisible`, `editing`, `nickname`, `saving`, and at least 2 handler functions. All of these should live in ProfileModal after the extraction.

The grace period banner (task_09) stays in RootNavigator — it is not part of the profile modal.

`handleSignOut` currently has a web-specific branch using `window.confirm` and `window.location.href`. This behavior should be preserved as-is during the move — do not refactor the sign-out logic in this task.

### Relevant Files

- `src/modules/auth/components/ProfileModal.tsx` — new file
- `src/core/navigation/RootNavigator.tsx` — remove inline modal code; use extracted component
- `src/modules/auth/components/TypeSettingsModal.tsx` — already extracted; just moved to render from ProfileModal
- `src/modules/auth/components/AccountDeletionModal.tsx` (task_09 output) — move trigger into ProfileModal
- `src/modules/auth/components/PrivacyPolicyModal.tsx` (task_05 output) — render from ProfileModal

### Dependent Files

- `task_15` (React.memo) — ProfileModal must be stable before adding memo to StickerCard
- `task_16` (CatalogProvider) — ProfileModal must be stable before refactoring CatalogProvider

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Phase 4; runs after all compliance tasks are closed

## Deliverables

- `src/modules/auth/components/ProfileModal.tsx` (new)
- `RootNavigator.tsx` ≤ 100 lines
- All existing profile-related behaviors preserved (nickname edit, TypeSettings, sign out, deletion)

## Tests

- Unit tests:
  - [ ] `ProfileModal` with `visible={true}` renders the nickname editor
  - [ ] `ProfileModal` with `visible={true}` renders the "Sair da conta" button
  - [ ] `ProfileModal` with `visible={true}` renders the "Política de Privacidade" button
  - [ ] `ProfileModal` with `visible={true}` renders the "Solicitar exclusão de conta" button (testID="request-deletion-btn")
  - [ ] Pressing "Política de Privacidade" opens the `PrivacyPolicyModal` (or calls `onOpenPrivacyPolicy`)
  - [ ] Pressing "Solicitar exclusão de conta" opens `AccountDeletionModal`
  - [ ] `ProfileModal` with `visible={false}` renders nothing
  - [ ] `onClose` is called when the profile modal close button is pressed
  - [ ] `RootNavigator` renders `ProfileModal` (not inline JSX) — snapshot test
- Integration tests:
  - [ ] Full smoke test: open profile → edit nickname → save → nickname updated in UI
  - [ ] Full smoke test: open profile → open TypeSettings → close TypeSettings → back in profile
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- `wc -l src/core/navigation/RootNavigator.tsx` output ≤ 100
- Zero user-visible behavior changes
