---
status: completed
title: "F6 — Login error feedback no LoginScreen"
type: frontend
complexity: low
dependencies: []
---

# Task 4: F6 — Login error feedback no LoginScreen

## Overview

Substitui o bloco `catch {}` silencioso do `LoginScreen` por uma resposta de erro visível ao usuário. Quando o login Google OAuth falha por erro de rede ou erro genérico, uma mensagem de texto aparece abaixo do botão e é auto-descartada após 6 segundos. Cancelamentos explícitos pelo usuário permanecem silenciosos.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F6 — Login Error Feedback" for the exact error classification logic and message strings
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `loginError: string | null` state variable to LoginScreen
- MUST replace the empty `catch {}` block with error classification: network error → "Sem conexão. Verifique sua internet e tente novamente.", cancelled → no message, other → "Não foi possível fazer login. Tente novamente."
- MUST render the error message below the Google Sign-In button with `testID="login-error"`
- MUST auto-dismiss the error message after 6 seconds via `setTimeout`
- MUST clear the error on each new login attempt (before the try block)
- MUST remove the dead-code `onLoginSuccess` prop from LoginScreen (the prop is always `() => {}` in the caller)
- SHOULD NOT change the visual layout for the non-error state
</requirements>

## Subtasks

- [x] 4.1 Add `loginError` state and clear it at the start of `handleGoogleLogin`
- [x] 4.2 Update the `catch` block to classify errors and call `setLoginError` with the appropriate message
- [x] 4.3 Add a 6-second auto-dismiss `setTimeout` that calls `setLoginError(null)`
- [x] 4.4 Render the error message below the login button with `testID="login-error"` and appropriate red styling
- [x] 4.5 Remove the `onLoginSuccess` prop from LoginScreen and its usage in RootNavigator

## Implementation Details

See TechSpec section "Phase 2 — F6 — Login Error Feedback" for the exact code structure, error classification logic, and Portuguese message strings.

Note: The `onLoginSuccess` prop is passed as `() => {}` from `RootNavigator` (a no-op). Auth state change is handled via the `onAuthStateChange` listener in `CatalogProvider`. Removing the prop simplifies the interface.

Cancellation detection: `authService.signInWithGoogle()` may throw with a message containing `"cancelled"` or `"user_cancelled_login"` depending on the platform — check both variants.

### Relevant Files

- `src/modules/auth/screens/LoginScreen.tsx` — only file to modify; current `catch {}` is at the end of `handleGoogleLogin`
- `src/core/navigation/RootNavigator.tsx` — passes `onLoginSuccess={() => {}}` to LoginScreen; remove after prop is deleted

### Dependent Files

- `task_05` (PrivacyPolicyModal + LoginScreen link) — depends on this task because both modify LoginScreen.tsx; must run after task_04

### Related ADRs

None applicable.

## Deliverables

- `LoginScreen.tsx` with error state, classification logic, auto-dismiss, and testID
- `RootNavigator.tsx` with `onLoginSuccess` prop removed from `LoginScreen` usage
- Unit tests for all error scenarios

## Tests

- Unit tests:
  - [x] `handleGoogleLogin` when `authService.signInWithGoogle()` throws a NetworkError → `getByTestId('login-error')` shows "Sem conexão. Verifique sua internet e tente novamente."
  - [x] `handleGoogleLogin` when `authService.signInWithGoogle()` throws an error with message containing "cancelled" → no error element rendered
  - [x] `handleGoogleLogin` when `authService.signInWithGoogle()` throws an unknown error → `getByTestId('login-error')` shows "Não foi possível fazer login. Tente novamente."
  - [x] Error is cleared (`loginError` is null) when `handleGoogleLogin` is called a second time before the first error auto-dismisses
  - [x] After successful login (no error thrown) → `queryByTestId('login-error')` returns null
- Integration tests:
  - [x] LoginScreen renders without error element in the initial state (no prior login attempt)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- No visible change to the LoginScreen layout in the non-error state
- `onLoginSuccess` prop removed from `LoginScreen` type definition and all call sites
