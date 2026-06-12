# Álbum Copa 2026 — Store Launch Readiness & Compliance

## Overview

The Álbum Copa 2026 app — a React Native sticker collection app for the 2026 FIFA World Cup —
is technically complete and deployed on Vercel. Before publishing to the Apple App Store and
Google Play Store, 14 audit findings must be resolved across four areas: credential security,
LGPD compliance, store submission requirements, and code quality.

This PRD defines what the app must do and what users must experience to satisfy Brazilian law
(LGPD), Apple and Google Store policies, and a quality bar appropriate for a production launch.

**Who it is for:** The primary user is the existing Álbum Copa 2026 user base — Brazilian
football fans who collect FIFA World Cup stickers. Secondary audience: App Store and Google
Play reviewers who must approve the app.

**Why it is valuable:** Without these improvements, the app cannot be published to mobile stores
and exposes users to security risks and LGPD non-compliance. Completing this work unlocks
distribution to millions of potential users on iOS and Android.

---

## Goals

- **G1**: App Store submission approved on first attempt — no rejection due to missing policy,
  manifest, or compliance items
- **G2**: Google Play submission approved on first attempt, meeting API level 35 target by
  August 2025 deadline
- **G3**: Full LGPD compliance — users can view, export, and permanently delete their data
- **G4**: Zero critical security findings — credentials protected, data isolated per user
- **G5**: Code quality metrics sustained — test coverage ≥ 80%, zero ESLint errors, zero
  TypeScript strict violations introduced
- **G6**: All 14 audit items resolved and verified before store submission

---

## User Stories

### Primary Persona: Colecionador (Sticker Collector)

- As a collector, I want to see a clear Privacy Policy so that I understand what data the app collects about me.
- As a collector, I want to request account deletion so that I can exercise my LGPD rights.
- As a collector, I want a 30-day grace period after requesting deletion so that I can recover my account if I change my mind.
- As a collector, I want clear error messages when login fails so that I know what went wrong.
- As a collector, I want the app to open instantly on my phone (from the App Store) so that I can start using it immediately.

### Secondary Persona: App Store / Play Store Reviewer

- As a store reviewer, I need a public Privacy Policy URL so that I can verify compliance before approving the app.
- As a store reviewer, I need an iOS Privacy Manifest so that I can confirm the app declares all sensitive API usage.
- As a store reviewer, I need a functioning "Delete Account" feature so that I can confirm the app meets Apple's account deletion requirement.

### Secondary Persona: Developer / Maintainer

- As a developer, I want credentials stored securely (not in plain text) so that the codebase can be open without exposing production secrets.
- As a developer, I want CatalogProvider's responsibilities separated so that each concern is independently testable and modifiable.
- As a developer, I want ProfileModal extracted from RootNavigator so that navigation and profile management can be tested in isolation.

---

## Core Features

### F1 — Credential & Secret Protection *(Phase 1)*

The app stores Supabase URL, Supabase anon key, and Apple/Google build credentials securely,
never in version-controlled files. Build pipelines retrieve secrets from EAS's encrypted
secret store at build time.

**Behavior:**
- `.env` file removed from git history; Supabase anon key rotated
- `eas.json` references EAS secret variables instead of plaintext values
- Google service account key stored as an EAS secret, not a committed file
- Apple ID and Team ID moved to EAS secrets

### F2 — Row-Level Security (RLS) *(Phase 1)*

Every user's data (collection entries, album records) is isolated in Supabase. No authenticated
user can read or modify another user's records — enforced at the database level, not just
in application code.

**Behavior:**
- SELECT, INSERT, UPDATE, DELETE on `user_collections` and `user_albums` restricted to rows
  where `user_id = auth.uid()`
- Verification: attempting to query another user's `user_album_id` returns 0 rows

### F3 — Build Configuration Hardening *(Phase 1)*

Android and iOS build configurations declare explicit compatibility ranges so the app is
accepted by both stores and works correctly on target devices.

**Behavior:**
- `minSdkVersion` set to 34 (Android 14) in `app.json`
- `deploymentTarget` updated to iOS 17.0 in `app.json`
- Target API Level set to 35 (Android 15), satisfying Google Play's August 2025 requirement

### F4 — Privacy Policy Screen *(Phase 2)*

A dedicated in-app screen presents the full Privacy Policy in Brazilian Portuguese. Accessible
from the Profile modal and the Login screen footer. Content covers what data is collected
(email, name, avatar, sticker collection), retention periods, LGPD rights, and contact
information for the Data Protection Officer.

**Behavior:**
- Accessible from: Profile modal → "Política de Privacidade" button; Login screen → footer link
- Scrollable, readable text — no webview dependency
- Also published at a public URL on Vercel (e.g. `/privacidade`) for App Store Connect and
  Play Console URL fields — this is required for store submission even when the in-app screen
  exists

### F5 — Account Deletion with Grace Period *(Phase 2)*

Users can request permanent deletion of their account and all associated data. A 30-day
grace period allows recovery before irreversible deletion occurs.

**Behavior:**
1. User opens Profile modal → "Solicitar exclusão de conta" button
2. Confirmation dialog explains: account deactivated for 30 days, then permanently deleted
3. On confirmation: account marked as "pending deletion" with a timestamp
4. During grace period: user can log back in to cancel deletion
5. After 30 days: Supabase scheduled job (or next login check) permanently deletes
   `user_collections`, `user_albums`, and Supabase auth user record
6. Email notification sent at request time and 3 days before final deletion

### F6 — Login Error Feedback *(Phase 2)*

When Google OAuth login fails for any reason, the user receives a visible, actionable error
message instead of silently remaining on the Login screen.

**Behavior:**
- Network error: "Sem conexão. Verifique sua internet e tente novamente."
- Auth cancelled by user: no message (silent is correct for user-initiated cancellation)
- Any other error: "Não foi possível fazer login. Tente novamente."
- Error message displayed inline below the login button, auto-dismissed after 6 seconds

### F7 — iOS Privacy Manifest *(Phase 3)*

The app includes a `PrivacyInfo.xcprivacy` file that Apple requires for all iOS 17+ app
submissions. The manifest declares which privacy-sensitive APIs the app uses and why.

**Behavior:**
- File declares: no user tracking (`NSPrivacyTracking: false`)
- No tracking domains listed
- Required reason APIs documented: `UserDefaults` (for AsyncStorage/NSUserDefaults under the hood)
- Third-party SDKs with their own privacy manifests listed (Supabase, Expo modules)

### F8 — Asset Validation *(Phase 3)*

All required store assets (app icon, adaptive icon, splash screen) are present at required
resolutions and verified before submission.

**Behavior:**
- iOS app icon: 1024×1024 PNG, no transparency, no rounded corners (Apple adds rounding)
- Android adaptive icon foreground: 108×108dp safe zone within 432×432px PNG
- Android adaptive icon background: solid color or 432×432px PNG
- Android monochrome icon: single-color 432×432px PNG for themed icons
- Splash screen: visible on both iOS and Android without clipping key content

### F9 — Store Metadata *(Phase 3)*

Complete metadata prepared and submitted to App Store Connect and Google Play Console.

**Deliverables:**
- **App name**: "Álbum Copa 2026"
- **Short description** (30 chars, Android): "Monte seu álbum da Copa 2026"
- **Long description** (4000 chars max): covers sticker collecting, offline-first, account sync
- **Keywords** (iOS, 100 chars): "figurinhas,copa,album,panini,stickers,copa mundo,2026,futebol,colecao"
- **Category**: Sports (iOS) / Sports (Android)
- **Screenshots**: minimum 3 per device size (iPhone 6.7", iPad 12.9", Android phone)
  — screens: Home stats, Album list, Team detail with stickers marked
- **Privacy Policy URL**: public Vercel page
- **Release notes**: "Versão inicial — Monte sua coleção da Copa do Mundo 2026"

### F10 — StickerCard Performance Optimization *(Phase 4)*

`StickerCard` and `CromoCard` components are wrapped with `React.memo` so that marking
one sticker does not trigger re-render of the entire album grid.

**Behavior:**
- Tapping a sticker re-renders only that card, not the full FlatList
- Visually imperceptible to user; measurable in React DevTools profiler

### F11 — ProfileModal Extraction *(Phase 4)*

The Profile modal (avatar, nickname editor, sign out, album switcher) is extracted from
`RootNavigator` into a standalone `ProfileModal` component.

**Behavior:**
- No change to user-visible behavior
- Profile modal accessible from the same floating avatar button
- Navigator file reduces from ~258 lines to ~80 lines

### F12 — CatalogProvider Decomposition *(Phase 4)*

`CatalogProvider`'s 8 responsibilities are separated into focused providers/hooks so each
concern is independently maintainable and testable.

**Behavior:**
- No change to user-visible behavior
- Bootstrap, auth handling, catalog loading, and merge dialog are independently testable units

### F13 — Test Library Migration *(Phase 4)*

`@testing-library/jest-native` (deprecated) replaced with the built-in matchers from
`@testing-library/react-native` v13.4+. All existing tests continue to pass.

**Behavior:**
- No change to user-visible behavior
- `npm test` passes with no deprecation warnings
- Coverage remains ≥ 80%

---

## User Experience

### Privacy Policy discovery
Users find the Privacy Policy via two paths:
1. Login screen footer: small "Política de Privacidade" link before signing in
2. Profile modal: button between "Tipos controlados" and "Fechar"

The screen opens inline (no new navigation stack push), with a close button at the top.

### Account deletion flow
1. User opens Profile modal
2. Taps "Solicitar exclusão de conta" (red text, below "Sair da conta")
3. Full-screen confirmation dialog: explains 30-day grace period, lists what will be deleted
4. User types "EXCLUIR" to confirm (prevents accidental taps)
5. Confirmation screen: "Sua conta será excluída em 30 dias. Você receberá um e-mail de confirmação."
6. During grace period: banner at top of app "Conta com exclusão agendada — Cancelar"
7. After 30 days: all data permanently removed, user redirected to Login screen

### Login error feedback
Error message appears as a red banner below the Google Sign-In button. Auto-dismisses after
6 seconds. Does not block the button from being tapped again.

### No regressions on existing flows
All Phase 4 refactoring (React.memo, ProfileModal, CatalogProvider) produces zero visible
change to users. Existing sticker marking, navigation, and sync flows remain identical.

---

## High-Level Technical Constraints

- LGPD (Lei 15.352/2026): data deletion must be permanent within 30 days of user request;
  privacy policy must be available in Brazilian Portuguese; users must be informed of their
  rights (access, correction, deletion, portability)
- Apple App Store: Privacy Manifest required for iOS 17+ submissions; account deletion
  required for apps with account creation; Privacy Policy URL required in App Store Connect
- Google Play: Target API Level 35 required for new submissions by August 31, 2025;
  Data Safety section must be completed in Play Console
- EAS (Expo Application Services): all credentials managed via EAS secrets or managed
  credentials — no plaintext secrets in committed files
- Supabase RLS: data isolation enforced at database level, not just application level

---

## Non-Goals (Out of Scope)

- **GDPR for non-Brazilian users**: app is Brazil-only; EU/international compliance deferred
- **Data portability export**: user can view their collection in-app; downloadable export
  (JSON/CSV) deferred to a future release
- **Multi-language support**: app remains Portuguese-only; localization deferred
- **Analytics/crash reporting**: no telemetry SDK added in this cycle (e.g., Sentry, Firebase)
- **Push notifications**: no notification system for deletion reminders in this cycle
  (email is sufficient for LGPD)
- **Automated screenshot generation**: screenshots captured manually; Maestro/Detox automation
  deferred
- **New user-facing features**: this PRD covers compliance and quality only; no new
  sticker/collection features
- **Expo SDK upgrade**: upgrade to SDK 57/58 is a separate initiative

---

## Phased Rollout Plan

### Phase 1 — Infrastructure & Security *(~5 days)*
**Includes:** F1 (credential protection), F2 (RLS), F3 (build config)
**Success criteria:**
- [ ] `.env` removed from git history, Supabase key rotated
- [ ] `eas.json` references EAS secrets only
- [ ] RLS policies active on `user_collections` and `user_albums`
- [ ] RLS verified: user A cannot query user B's data
- [ ] `minSdkVersion: 34` and `deploymentTarget: "17.0"` in `app.json`
- [ ] `npm run lint` and `npm test` pass with no regressions

### Phase 2 — Compliance & Privacy *(~5 days)*
**Depends on:** Phase 1 (RLS must be live before account deletion)
**Includes:** F4 (privacy policy screen + Vercel page), F5 (account deletion), F6 (login errors)
**Success criteria:**
- [ ] Privacy Policy screen accessible from Profile modal and Login screen
- [ ] Public URL live at `album-copa-2026-sable.vercel.app/privacidade`
- [ ] Account deletion request creates pending-deletion record in Supabase
- [ ] 30-day grace period: user can cancel via in-app banner
- [ ] After grace period: all user data permanently deleted from Supabase
- [ ] Login error message visible for network failures

### Phase 3 — Store Readiness *(~4 days)*
**Depends on:** Phase 2 (privacy policy URL required for store listing)
**Includes:** F7 (iOS Privacy Manifest), F8 (asset validation), F9 (store metadata)
**Success criteria:**
- [ ] `PrivacyInfo.xcprivacy` present and correctly formatted
- [ ] All icon assets at required resolutions verified
- [ ] App Store Connect listing 100% complete (description, keywords, screenshots, policy URL)
- [ ] Google Play Console listing 100% complete (description, screenshots, Data Safety filled)
- [ ] `eas build --platform=ios --profile=production` succeeds
- [ ] `eas build --platform=android --profile=production` succeeds

### Phase 4 — Code Quality *(~4 days)*
**Depends on:** Phase 3 (all compliance items closed)
**Includes:** F10 (React.memo), F11 (ProfileModal), F12 (CatalogProvider), F13 (test migration)
**Success criteria:**
- [ ] `StickerCard` and `CromoCard` wrapped with `React.memo`
- [ ] `ProfileModal` is a standalone component; `RootNavigator` < 100 lines
- [ ] `CatalogProvider` responsibilities separated into focused units
- [ ] `@testing-library/jest-native` removed from dependencies
- [ ] `npm test` passes with ≥ 80% coverage and zero deprecation warnings
- [ ] Zero new ESLint errors introduced

---

## Success Metrics

| Metric | Target |
|--------|--------|
| App Store approval | First submission approved, no rejections |
| Google Play approval | First submission approved, no rejections |
| LGPD compliance | Account deletion functional, privacy policy accessible |
| Security posture | Zero plaintext credentials in repository; RLS active |
| Test coverage | ≥ 80% (branches, functions, lines, statements) |
| ESLint errors | 0 in `src/**` |
| TypeScript strict violations | 0 introduced by this work |
| Privacy Policy URL | Live and accessible before store submission |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Apple rejects due to in-app-only Privacy Policy (requires public URL) | High | Publish Privacy Policy page on Vercel (`/privacidade`) as part of F4 — this is mandatory for App Store Connect |
| Google Play rejects due to Target API < 35 after August 2025 | High | Set targetSdkVersion 35 in Phase 1 (F3) |
| Account deletion email not delivered (LGPD violation) | Medium | Use Supabase's built-in email (auth confirmation emails) or integrate Resend/SendGrid in Phase 2 |
| RLS changes break existing app behavior | Medium | Test with multiple user accounts before deploying Phase 1; include RLS tests |
| Supabase anon key rotation breaks deployed Vercel app | Medium | Rotate key and update Vercel environment variables atomically in the same deploy |
| Phase 4 refactoring introduces regressions | Low | Each refactoring item has explicit test coverage requirements; no behavior changes allowed |

---

## Architecture Decision Records

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Implement all 14 audit items
  in 4 sequential phases (Security → Compliance → Store → Quality) rather than parallel tracks
  or minimum-compliance approach, to minimize risk for a solo-developer project

---

## Open Questions

1. **Privacy Policy public URL**: ✅ **Resolved** — Privacy Policy will be published both
   as an in-app screen AND as a public static page at
   `album-copa-2026-sable.vercel.app/privacidade`. F4 covers both deliverables.

2. **Account deletion email provider**: Sending deletion confirmation and reminder emails requires
   an email service. Supabase provides transactional emails (auth emails only). For custom
   deletion emails, an external provider (Resend, SendGrid) may be needed. **Recommended**:
   use Supabase Edge Functions + Resend free tier. Awaiting decision.

3. **"EXCLUIR" confirmation typed text**: ✅ **Resolved** — User must type "EXCLUIR" to
   confirm account deletion. Prevents accidental permanent data loss.

4. **versionCode increment**: Current `versionCode` is 1 and `buildNumber` is 22. Should these
   be incremented as part of this work, or handled separately at submission time?

5. **Data Safety section (Google Play)**: The form in Play Console requires specifying exactly
   which data types are collected and for what purpose. Needs to be filled manually by the
   account holder in Play Console — cannot be automated via EAS.
