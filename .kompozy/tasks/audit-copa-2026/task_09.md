---
status: completed
title: "F5c — AccountDeletionModal + deletion UI no RootNavigator"
type: frontend
complexity: medium
dependencies:
  - task_08
---

# Task 9: F5c — AccountDeletionModal + deletion UI no RootNavigator

## Overview

Cria o modal de confirmação de exclusão de conta (requer digitação de "EXCLUIR"), adiciona o botão "Solicitar exclusão de conta" no bloco inline de profile no `RootNavigator`, e adiciona o banner de carência no topo do app quando `authStore.pendingDeletion` está ativo. A UI de exclusão é inserida diretamente no código inline do `RootNavigator` agora para ser extraída junto com o `ProfileModal` na task_14.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F5 — UI Flow" for the complete user flow and component structure
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `src/modules/auth/components/AccountDeletionModal.tsx` with: explanation text of 30-day grace period, TextInput requiring user to type "EXCLUIR" (testID="confirm-input"), disabled confirmation button until input === "EXCLUIR" (testID="confirm-deletion-btn"), cancel button (testID="cancel-deletion-btn")
- MUST add "Solicitar exclusão de conta" button to the inline profile modal section in RootNavigator (red text, testID="request-deletion-btn")
- MUST add grace period banner to RootNavigator: visible when `authStore.pendingDeletion !== null` and `cancelled_at === null`, shows scheduled deletion date, includes "Cancelar" touchable (testID="cancel-deletion-banner")
- MUST call `accountDeletionService.requestDeletion()` when "EXCLUIR" is typed and confirmed
- MUST call `accountDeletionService.cancelDeletion()` when "Cancelar" is pressed in the banner
- MUST update `authStore.pendingDeletion` after request and cancellation
- SHOULD show a success message after requesting deletion: "Sua conta será excluída em 30 dias."
</requirements>

## Subtasks

- [x] 9.1 Create `AccountDeletionModal.tsx` with TextInput, validation, confirmation button, and explanation text
- [x] 9.2 Add "Solicitar exclusão de conta" button to the inline profile modal block in `RootNavigator.tsx`
- [x] 9.3 Add state for `deletionModalVisible` and `AccountDeletionModal` rendering to `RootNavigator.tsx`
- [x] 9.4 Add grace period banner to `RootNavigator.tsx` main view, driven by `authStore.pendingDeletion`
- [x] 9.5 Wire banner "Cancelar" to `accountDeletionService.cancelDeletion()` and clear `authStore.pendingDeletion`

## Implementation Details

See TechSpec section "Phase 2 — F5 — UI Flow" for the full 7-step user journey and component structure.

Important: The deletion button and modal state are added to the INLINE profile modal code in `RootNavigator.tsx` (not a new file). task_14 will then extract all of this into `ProfileModal.tsx`. This approach prevents circular dependencies between the deletion UI and the ProfileModal extraction.

The grace period banner should be positioned above the main navigator content (not inside the tab navigator) so it is visible on all screens.

### Relevant Files

- `src/modules/auth/components/AccountDeletionModal.tsx` — new file to create
- `src/core/navigation/RootNavigator.tsx` — add deletion button, deletion modal state, and grace period banner

### Dependent Files

- `task_14` (ProfileModal extraction) — will move all deletion-related state/UI from RootNavigator into ProfileModal; depends on task_09 completing first

### Related ADRs

- [ADR-002: Dedicated Table for Account Deletion State](adrs/adr-002.md) — UI reflects the DeletionRequest shape
- [ADR-003: Supabase Edge Function + Resend](adrs/adr-003.md) — email is triggered from `requestDeletion` call in this UI

## Deliverables

- `src/modules/auth/components/AccountDeletionModal.tsx`
- `RootNavigator.tsx` updated with deletion button, modal, and grace period banner
- Unit tests for AccountDeletionModal

## Tests

- Unit tests:
  - [x] `AccountDeletionModal` with `visible={true}` renders `testID="confirm-input"` and `testID="confirm-deletion-btn"`
  - [x] `testID="confirm-deletion-btn"` is disabled when input value is empty
  - [x] `testID="confirm-deletion-btn"` is disabled when input value is "excluir" (lowercase — must be exact uppercase match)
  - [x] `testID="confirm-deletion-btn"` is enabled when input value is exactly "EXCLUIR"
  - [x] Pressing `testID="confirm-deletion-btn"` with input "EXCLUIR" calls the `onConfirm` callback
  - [x] Pressing `testID="cancel-deletion-btn"` calls `onCancel` without calling `onConfirm`
  - [x] Grace period banner renders when `pendingDeletion` has a non-null `scheduledDeleteAt` and null `cancelledAt`
  - [x] Grace period banner is not rendered when `pendingDeletion` is null
  - [x] Pressing `testID="cancel-deletion-banner"` calls `accountDeletionService.cancelDeletion`
- Integration tests:
  - [ ] Full UI flow: open modal → type "EXCLUIR" → confirm → `requestDeletion` called → banner becomes visible
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- "Confirmar exclusão" button remains disabled until exactly "EXCLUIR" is typed
- Grace period banner visible in app after deletion request, hidden after cancellation
