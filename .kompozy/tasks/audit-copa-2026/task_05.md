---
status: completed
title: "F4a — PrivacyPolicyModal + link no LoginScreen"
type: frontend
complexity: low
dependencies:
  - task_04
---

# Task 5: F4a — PrivacyPolicyModal + link no LoginScreen

## Overview

Cria o componente `PrivacyPolicyModal` com o texto completo da Política de Privacidade em português brasileiro, e adiciona dois pontos de acesso: um link no rodapé do `LoginScreen` (visível antes do login) e um botão no `ProfileModal` (adicionado na task_14). Esta task cobre apenas a criação do modal e o link no LoginScreen.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F4 — Privacy Policy Screen + Vercel Page" for component structure, access points, and content requirements
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `src/modules/auth/components/PrivacyPolicyModal.tsx` with props `visible: boolean` and `onClose: () => void`
- MUST include a close button with `testID="close-button"`
- MUST render the full Privacy Policy text in Brazilian Portuguese inside a ScrollView
- MUST include in the policy text: what data is collected (email, name, avatar, sticker collection), retention periods, LGPD rights (Art. 18), DPO contact email (manera@kbase.com.br), and app name + last updated date
- MUST add a footer link "Política de Privacidade" in `LoginScreen.tsx` below the Google Sign-In button with `testID="privacy-policy-link"`
- MUST use a Modal component (not navigation push) — opens inline without navigation stack
- SHOULD match existing app typography and color conventions (dark theme, colors.primary palette)
</requirements>

## Subtasks

- [x] 5.1 Create `PrivacyPolicyModal.tsx` with Modal, SafeAreaView, ScrollView, header with close button, and full policy text in pt-BR
- [x] 5.2 Add `privacyVisible` state to `LoginScreen.tsx` and the "Política de Privacidade" footer link
- [x] 5.3 Render `<PrivacyPolicyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />` in `LoginScreen`

## Implementation Details

See TechSpec section "Phase 2 — F4" for the component interface and access points. The same `PrivacyPolicyModal` component will also be used from `ProfileModal` (task_14) — design the component to be reusable with only props for visibility and close callback.

Policy content to include (minimum):
- Nome do app e data de última atualização
- Dados coletados: e-mail, nome, avatar (URL do perfil Google), coleção de figurinhas
- Finalidade: identificação do usuário, sincronização da coleção
- Retenção: dados mantidos enquanto a conta existir; excluídos após solicitação de exclusão
- Direitos LGPD (Art. 18): acesso, correção, exclusão, portabilidade
- Contato DPO: manera@kbase.com.br

### Relevant Files

- `src/modules/auth/components/PrivacyPolicyModal.tsx` — new file to create
- `src/modules/auth/screens/LoginScreen.tsx` — add footer link and modal state
- `src/shared/theme/` — check existing color tokens and text styles to match

### Dependent Files

- `task_14` (ProfileModal extraction) — will wire the same `PrivacyPolicyModal` into the extracted ProfileModal with an `onOpenPrivacyPolicy` callback

### Related ADRs

- [ADR-004: Static HTML for Vercel /privacidade](adrs/adr-004.md) — the in-app modal and the Vercel page have the same content; note the dual-maintenance requirement

## Deliverables

- `src/modules/auth/components/PrivacyPolicyModal.tsx` (new)
- `LoginScreen.tsx` updated with footer link and modal state
- Unit tests for both the modal and the footer link

## Tests

- Unit tests:
  - [ ] `PrivacyPolicyModal` with `visible={true}` renders the close button (`testID="close-button"`)
  - [ ] `PrivacyPolicyModal` with `visible={false}` renders nothing
  - [ ] Pressing the close button with `testID="close-button"` calls `onClose` exactly once
  - [ ] `PrivacyPolicyModal` with `visible={true}` contains the text "Política de Privacidade"
  - [ ] `PrivacyPolicyModal` with `visible={true}` contains the DPO contact email "manera@kbase.com.br"
  - [ ] `LoginScreen` renders the `testID="privacy-policy-link"` footer element
  - [ ] Pressing `testID="privacy-policy-link"` in LoginScreen opens the PrivacyPolicyModal (modal becomes visible)
- Integration tests:
  - [ ] LoginScreen renders with privacy link visible below the login button, without visual overlap
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- Modal opens from LoginScreen footer link on web and native
- Modal is scrollable and all required LGPD sections are present
