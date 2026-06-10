---
status: pending
title: "Implement Sign in with Apple (expo-apple-authentication)"
type: bugfix
complexity: high
dependencies:
  - task_12
---

# Implement Sign in with Apple (expo-apple-authentication)


## Overview

App Store Guideline 4.8 requires Sign in with Apple whenever any third-party social login is present. The app offers Google OAuth, so Apple sign-in is mandatory before App Store submission. This task installs `expo-apple-authentication`, adds `signInWithApple()` to `authService.ts`, and integrates the Apple button into the existing login UI — rendered only on iOS where the native sheet is available.

<critical>
- ALWAYS READ the PRD (F2.1) and TechSpec ADR-003 + "Core Interfaces — F2.1" and "Integration Points" sections before starting
- REFERENCE TECHSPEC for the exact signInWithIdToken flow and Supabase configuration steps
- FOCUS ON "WHAT" — native Apple auth sheet → Supabase signInWithIdToken → existing auth store
- MINIMIZE CODE — reuse existing auth store, user mapping, and onAuthStateChange handler
- TESTS REQUIRED — Apple sign-in is only testable on physical iOS device; document manual test steps
- BLOCKING DEPENDENCY: Apple Developer Portal configuration must be done BEFORE building (see Technical Dependencies)
</critical>

<requirements>
1. `expo-apple-authentication` MUST be installed via `npx expo install expo-apple-authentication`.
2. `expo-apple-authentication` MUST be added to `app.json` plugins.
3. `authService.signInWithApple()` MUST call `AppleAuthentication.signInAsync()` with FULL_NAME and EMAIL scopes.
4. The resulting `identityToken` MUST be passed to `supabase.auth.signInWithIdToken({ provider: 'apple', token })`.
5. The returned user MUST be mapped to `AppUser` using the same shape as `signInWithGoogle`.
6. The Apple button MUST only render on iOS and only when `AppleAuthentication.isAvailableAsync()` returns `true`.
7. `ERR_REQUEST_CANCELED` (user dismisses Apple sheet) MUST be caught and ignored — no error shown to user.
8. All other errors from `signInAsync` MUST be propagated to the login UI.
9. Supabase Apple OAuth provider MUST be configured in Supabase Dashboard (manual step — see Technical Dependencies).
10. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 13.1 Run `npx expo install expo-apple-authentication` and add to `app.json` plugins
- [ ] 13.2 Add `signInWithApple()` to `authService.ts` following the pattern in TechSpec ADR-003
- [ ] 13.3 Add `isAppleAvailable` state (from `isAvailableAsync`) to the login component
- [ ] 13.4 Render `AppleAuthentication.AppleAuthenticationButton` below the Google button when available
- [ ] 13.5 Wire button `onPress` to `authService.signInWithApple()` and update auth store on success
- [ ] 13.6 Handle `ERR_REQUEST_CANCELED` silently; surface other errors to user
- [ ] 13.7 Verify Supabase Apple provider is configured (manual step — document in task notes)

## Implementation Details

Three files: `package.json` (dependency), `app.json` (plugin), `src/modules/auth/services/authService.ts` (new method), and the login UI component (Apple button). See TechSpec ADR-003 "Core Interfaces — F2.1" for the complete `signInWithApple` implementation.

### Technical Dependencies (BLOCKING)
Before running the Phase 2 EAS build, these manual steps MUST be completed:
1. Apple Developer Portal → Certificates, Identifiers & Profiles → App IDs → `com.manera.albumcopa2026` → Enable "Sign in with Apple" capability
2. Create a Service ID and private key (.p8 file) for Supabase
3. Supabase Dashboard → Authentication → Providers → Apple → enable and configure with Service ID + key

### Relevant Files
- `src/modules/auth/services/authService.ts` — add `signInWithApple()` method
- `src/modules/auth/components/` — login UI component (find the sign-in screen/modal)
- `app.json` — add `expo-apple-authentication` plugin
- `package.json` — new dependency

### Dependent Files
- `src/core/providers/CatalogProvider.tsx` — `onAuthStateChange` handles `SIGNED_IN` event; no change needed
- `src/modules/auth/store/authStore.ts` — `setUser` called after successful sign-in

### Related ADRs
- [ADR-003: Sign in with Apple via expo-apple-authentication + signInWithIdToken](adrs/adr-003.md) — Defines the native sheet approach and Supabase integration

## Deliverables

- `expo-apple-authentication` installed and configured
- `authService.signInWithApple()` implemented
- Apple sign-in button in login UI (iOS only)
- Manual test confirmation on physical iPhone

## Tests

### Unit Tests
- [ ] `signInWithApple()` with valid `identityToken`: calls `supabase.auth.signInWithIdToken` with `provider: 'apple'`
- [ ] `signInWithApple()` with `ERR_REQUEST_CANCELED`: returns without throwing
- [ ] `signInWithApple()` with other error: propagates the error
- [ ] Apple button rendered when `isAvailableAsync()` returns `true` (iOS)
- [ ] Apple button NOT rendered when `isAvailableAsync()` returns `false` (web/Android)

### Integration Tests
- [ ] (Manual — physical iPhone) Tapping "Sign in with Apple" shows native Apple auth sheet
- [ ] (Manual — physical iPhone) Completing Apple sign-in creates/logs in user and shows Home screen
- [ ] (Manual — physical iPhone) Cancelling Apple sheet returns to login screen with no error message

## Success Criteria

- All tests passing
- Test coverage >= 80% for signInWithApple method
- Apple sign-in button visible on iOS login screen
- App Store submission not rejected for Guideline 4.8
