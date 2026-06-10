# PRD: Audit Fixes v1 — Álbum Copa 2026

## Overview

The Álbum Copa 2026 app passes all web validation but fails to render on iOS TestFlight across six consecutive builds, showing a black screen and blocking all user interaction. A full technical audit identified 31 issues across four severity levels that, if unresolved, prevent app store submission and degrade the experience for authenticated users.

This PRD covers the remediation of all 31 audit findings in three sequential phases: resolving the iOS black screen first, then achieving store readiness, then delivering quality and polish improvements. The primary users affected are sticker collectors accessing the app on iPhone via TestFlight and, once published, via the App Store and Google Play.

---

## Goals

- **iOS app renders correctly on TestFlight** within Phase 1 (zero black screen occurrences after fix build).
- **App approved and live on App Store and Google Play** after Phase 2.
- **Zero data-loss incidents** related to `toggleSticker` race conditions or `replaceAll` silent failures after Phase 2.
- **App launches successfully offline** (no crash when device has no network) after Phase 2.
- **All 31 audit findings resolved** by end of Phase 3.
- **Sign in with Apple implemented** before App Store submission (required by Guideline 4.8).

---

## User Stories

### End User — Sticker Collector (iOS)

- As a collector on iPhone, I want the app to open and show the home screen when I launch it from TestFlight, so that I can start tracking my stickers.
- As a collector, I want the app to open even when I have no internet connection, so that I can consult my collection offline.
- As a collector, I want my sticker collection to be saved reliably, so that I never lose progress when the app syncs.

### End User — Sticker Collector (Android)

- As a collector on Android, I want to download the app from Google Play, so that I can start collecting without sideloading.

### Authenticated User

- As a logged-in user, I want to sign in with Apple on iPhone, so that I can use the app without sharing my Google credentials.
- As a logged-in user, I want the app to detect when my session expires and prompt me to log in again, so that I am not silently logged out with data stuck in a broken state.

### App Owner

- As the app owner, I want the app to comply with App Store Guideline 4.8 (Sign in with Apple), so that the review is not rejected.
- As the app owner, I want user data handling to comply with LGPD, so that the privacy policy satisfies both stores' requirements.

---

## Core Features

### Phase 1 — iOS Black Screen Resolution

**F1.1 — Splash Screen Management**
The app must install and configure `expo-splash-screen`. The native iOS splash must be kept visible until fonts finish loading, then dismissed. Without this, iOS dismisses the native splash immediately and shows a blank black view while the JS bundle hydrates. The existing `splash-icon.png` asset (`assets/splash-icon.png`) must be referenced in `app.json` under the `splash` block with background color `#0A2342`.

**F1.2 — Worklets Conflict Removal**
`react-native-worklets` must be removed from `package.json`. Reanimated 4.x bundles its own worklets runtime; having both registers duplicate TurboModules under New Architecture, causing a silent JS runtime crash before `App()` is ever called. The web renderer is unaffected by this crash, which explains why web works and iOS does not.

**F1.3 — GestureHandlerRootView Wrapper**
`App.tsx` must wrap its entire component tree inside `GestureHandlerRootView`. React Native Gesture Handler 2.x with New Architecture requires this root wrapper; without it, the gesture recognizer fails to initialize on the native thread and the app crashes silently on iOS.

**F1.4 — Bootstrap Loading Timeout Safeguard**
The `CatalogProvider` bootstrap must guarantee `authStore.setLoading(false)` is called even if a TurboModule or Supabase call hangs. A `Promise.race` with an 8-second timeout must be added around the auth portion of bootstrap. If the timeout fires, the app proceeds with `user: null` (unauthenticated state) so the user sees the app instead of a black screen.

**F1.5 — EAS Xcode Image Switch to Stable**
The `eas.json` production iOS profile must switch from `macos-sequoia-15.6-xcode-26.1` (beta) to a current stable image. Beta Xcode toolchains produce binaries with linking issues that manifest as black screens on physical devices but not simulators.

**F1.6 — withFollyFix Idempotency Fix**
The `withFollyFix.js` plugin applies two sequential `gsub` operations on Swift files, which duplicates the `nonisolated(unsafe)` prefix on incremental rebuilds. The plugin must be updated so the substitution is atomic and guarded: if `nonisolated(unsafe)` is already present, skip the file.

---

### Phase 2 — Store Readiness

**F2.1 — Sign in with Apple**
The app offers Google OAuth login. App Store Guideline 4.8 mandates Sign in with Apple whenever any third-party social login is present. `expo-apple-authentication` must be integrated and the Supabase Apple OAuth provider configured before App Store submission.

**F2.2 — Android autoIncrement and Service Account**
`eas.json` must add `autoIncrement: true` to the `production.android` block (matching the existing iOS setting). The `secrets/service-account-key.json` Google Play service account file must be created and referenced so `eas submit --platform android` succeeds.

**F2.3 — Splash Configuration in app.json**
`app.json` must include a `splash` block (`image`, `resizeMode: "contain"`, `backgroundColor: "#0A2342"`) and an `ios.splash` block. Without this, both stores show a plain black screen during app launch on user devices.

**F2.4 — toggleSticker Race Condition Fix**
In `stickerStore.ts`, the rollback path in `toggleSticker` must use `get().collection` (current state at rollback time) instead of the stale closure variable. A 300ms debounce must be added to the sticker card tap handler to prevent double-tap from creating two concurrent state mutations.

**F2.5 — Offline Catalog Fallback**
`catalogService.fetchAndCacheFullCatalog` must fall back to `loadCacheLocally()` when the network is unreachable, rather than throwing. `checkVersion` must return `null` (not throw) when offline. Users must be able to open the app without a network connection if a catalog has been cached previously.

**F2.6 — Auth Session Validation**
`authService.getCurrentUser` must use Supabase's server-validated `getUser()` instead of `getSession()`. When any API call returns 401, `cloudCollectionService` must trigger `signOut()` and clear the auth store, so users are redirected to login rather than silently stuck in a broken authenticated state.

**F2.7 — cloudCollectionService Insert Error Handling**
`replaceAll` must check the result of the `insert` call and throw on error. The current behavior deletes all rows then silently ignores insert failures, leaving the cloud collection empty. An `upsert` approach should be evaluated to eliminate the empty intermediate state.

**F2.8 — syncService Memory Leak and Concurrency Fix**
`syncService.start()` must call `stop()` first when already running, to cancel the previous NetInfo listener before registering a new one. An `isFlushing` flag must prevent concurrent `tryFlush()` calls when NetInfo fires rapid reconnection events.

**F2.9 — LGPD/GDPR Privacy Policy Update**
The privacy policy linked in `app.json` (`privacyPolicyUrl`) must be updated to cover: legal basis for processing under LGPD, international data transfer (Supabase servers in the US), data retention period, account and data deletion mechanism, and DPO contact. The App Store Connect "App Privacy" questionnaire must be filled with the correct data categories (contact info, identifiers, usage data).

**F2.10 — ESLint Script Fix**
The `lint` npm script must remove the deprecated `--ext` flag (not supported in ESLint v10 flat config). The script must run correctly in CI so pre-commit hooks catch issues before builds.

**F2.11 — CatalogProvider Unified Finally Block**
The second `try` block in `CatalogProvider` bootstrap must include a `finally` that resets `stickerStore.loading` to `false`. If `initializeCatalog()` throws, the loading spinner must not persist indefinitely.

---

### Phase 3 — Quality and Polish

**F3.1 — logger Production Guard**
`logger.warn` and `logger.error` must apply the same `__DEV__` guard as `logger.log`, or route to a monitoring SDK (e.g., Sentry) with PII sanitization. Raw `console.warn` calls in `supabase.ts` must be replaced with `logger.warn`.

**F3.2 — resetCollection Rollback**
`stickerStore.resetCollection` must restore local state on cloud failure and notify the user, rather than silently clearing local data when the remote call fails.

**F3.3 — Metro Alias Cleanup**
Any residual `@app/*` imports must be updated to `@core/*`. The Jest `moduleNameMapper` must point `@app/*` to `src/core/` to match the renamed directory.

**F3.4 — babel-preset-expo to devDependencies**
`babel-preset-expo` must be moved from `dependencies` to `devDependencies` so it is not included in the production bundle.

**F3.5 — Platform-safe window References**
References to `window` and `window.location` in `RootNavigator.tsx` must be guarded with `Platform.OS === 'web' && typeof window !== 'undefined'` to prevent `ReferenceError` under New Architecture's stricter module loading.

**F3.6 — AlbumListScreen FlatList Performance**
`AlbumListScreen` FlatList must add `getItemLayout` with a fixed item height, and `renderItem` / `getTeamStats` must be wrapped in `useCallback`/`useMemo` to prevent full-list re-renders on each sticker tap.

**F3.7 — Zustand Selectors**
`useStickerStore` calls in `StickerCard`, `ScreenHeader`, `HomeScreen`, `AlbumListScreen`, and `UserAlbumsModal` must use field-level selectors (e.g., `useStickerStore(s => s.getStatus(id))`) instead of destructuring the full store, to prevent unnecessary re-renders when unrelated state changes.

**F3.8 — Cross-Platform Alert Helper**
`StickerCard.handlePress` must use a platform-safe alert: `Alert.alert` on native, `window.confirm` on web. A shared `crossPlatformAlert()` helper must be created. `handlePress` must be wrapped in `useCallback`.

**F3.9 — Accessibility Labels**
Interactive elements in `CromoCard`, `RootNavigator`, `AlbumListScreen`, and `UserAlbumsModal` (card buttons, profile avatar, type chips, edit/delete icons) must have `accessibilityLabel` and `accessibilityRole="button"`.

**F3.10 — offlineQueueService Pre-Init Guard**
`offlineQueueService.enqueue` must log a warning when called before `init()` completes, so pre-init operations are not silently dropped.

**F3.11 — app.json Cleanup**
`experiments.typedRoutes: false` (irrelevant without Expo Router) must be removed. `predictiveBackGestureEnabled` must be evaluated for Android 13+ UX compliance.

---

## User Experience

**Phase 1 launch flow (iOS):**
1. User taps app icon → native splash screen (`#0A2342` background with logo) appears immediately.
2. App loads fonts and initializes. If loading exceeds 8 seconds, the splash is dismissed and the user sees the home screen (unauthenticated).
3. Splash dismisses → home screen renders correctly. Black screen never occurs.

**Offline experience (Phase 2):**
1. User opens app with no network → splash appears → catalog loads from local cache → home screen renders.
2. A subtle sync indicator shows "offline" state. All read operations work; writes are queued.
3. When connectivity is restored, the offline queue flushes automatically without duplicates.

**Session expiry (Phase 2):**
1. User's auth token expires → next API call returns 401 → app detects this → user is signed out automatically.
2. Login screen appears with a clear message. No silent broken state.

**Store submission flows:**
- iOS: user can choose Sign in with Apple or Google at login.
- Android: app available on Google Play via standard install flow.

---

## High-Level Technical Constraints

- App must target Expo SDK 56 throughout all phases. No SDK upgrade within this PRD scope.
- New Architecture (`newArchEnabled: true`) must remain enabled. All fixes must be compatible with New Architecture / TurboModules.
- EAS Build must be used for all iOS and Android production builds. No local Xcode builds.
- Supabase remains the authentication and cloud sync provider. No provider migration.
- LGPD compliance applies to all user data (email, name, avatar, sticker collection). Data must not be transmitted to any additional third parties beyond Supabase and Apple/Google OAuth providers.
- Sign in with Apple must be implemented using `expo-apple-authentication` only (no bare native changes).
- The privacy policy URL in `app.json` must point to a publicly accessible page before store submission.

---

## Non-Goals (Out of Scope)

- No new user-facing features in this PRD. All work is remediation and quality improvement.
- No Expo SDK upgrade (SDK 57+) within this scope.
- No migration away from Supabase or any backend changes beyond OAuth provider configuration.
- No new screens, navigation flows, or sticker collection mechanics.
- No Sentry/Crashlytics integration (monitoring SDK is optional, not required, in Phase 3).
- Android UI testing on physical devices is not in scope for Phase 1 (focus is iOS).
- App Store and Google Play metadata (screenshots, description, keywords) are managed manually outside this PRD.

---

## Phased Rollout Plan

### Phase 1 — iOS Black Screen Fix
**Fixes included:** F1.1, F1.2, F1.3, F1.4, F1.5, F1.6

**Success criteria to proceed:**
- EAS build completes without errors on stable Xcode image.
- App opens and renders the Home screen on at least one physical iPhone via TestFlight.
- No black screen on cold launch (3 consecutive opens).
- `expo-splash-screen` shows logo on launch, then dismisses correctly.

### Phase 2 — Store Readiness
**Fixes included:** F2.1 through F2.11

**Success criteria to proceed:**
- App submitted and approved on App Store (no Guideline 4.8 rejection).
- App submitted and approved on Google Play (versionCode increments correctly).
- App opens offline with cached catalog.
- No data-loss reports in TestFlight beta group over 5-day soak period.
- Privacy policy URL live and covers all required LGPD fields.

### Phase 3 — Quality and Polish
**Fixes included:** F3.1 through F3.11

**Success criteria (long-term):**
- No production logger leaking PII (verified via Sentry or equivalent).
- FlatList scroll performance ≥ 60 FPS on AlbumListScreen on iPhone SE (375px).
- All interactive elements pass VoiceOver accessibility audit on iOS.
- Zero `@app/*` import errors in test suite.

---

## Success Metrics

| Metric | Target | Phase |
|--------|--------|-------|
| iOS black screen occurrences on TestFlight | 0 | Phase 1 |
| App Store review approval | Approved (no rejections) | Phase 2 |
| Google Play review approval | Approved | Phase 2 |
| Cold launch time (iPhone 12+) | < 3 seconds to Home screen | Phase 1 |
| Offline launch success rate | 100% when catalog cached | Phase 2 |
| Data-loss incidents (toggleSticker) | 0 | Phase 2 |
| Auth 401 silent failures | 0 | Phase 2 |
| Audit findings resolved | 31 / 31 | Phase 3 |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Phase 1 fixes do not fully resolve black screen | Medium | High | Isolate each fix (F1.1–F1.6) into separate commits; bisect if needed. |
| Stable Xcode image incompatible with reanimated 4.x | Low | High | Test with `macos-sonoma-14.4-xcode-15.4`; fallback to `macos-sequoia-15.3-xcode-25.0` if needed. |
| Sign in with Apple review delay (Phase 2) | Medium | Medium | Submit Sign in with Apple capability to Apple Developer Portal early; allow 1–3 days for provisioning. |
| Google Play service account setup delay | Low | High | Create service account in Play Console immediately; it takes up to 24h to propagate permissions. |
| LGPD privacy policy requires legal review | Medium | Medium | Use a structured template; block submission only if legal review is required by the business. |
| `react-native-worklets` removal breaks animation | Low | Medium | Reanimated 4.x does not require worklets package; regression test all animated screens after removal. |

---

## Architecture Decision Records

- [ADR-001: Three-Phase Rollout for Audit Fixes](adrs/adr-001.md) — Fixes delivered in three phases (black screen → store readiness → quality) rather than big bang or four severity-based phases.

---

## Open Questions

1. **Xcode stable image:** Which EAS-supported stable image should be used in Phase 1? Must be confirmed against `https://docs.expo.dev/build-reference/infrastructure/` at implementation time.
2. **Apple Developer Portal:** Is the Sign in with Apple capability already added to the `com.manera.albumcopa2026` App ID? If not, it must be added before building.
3. **Google Play Console:** Has the app listing been created in Google Play Console? A listing must exist before `eas submit --platform android` can succeed.
4. **Privacy Policy hosting:** Is `https://album-copa-2026-sable.vercel.app/privacy-policy` the permanent URL, or does it need to be updated before store submission?
5. **Sentry/Crashlytics:** Is there a preference for the monitoring SDK in Phase 3, or should `logger` simply suppress output in production without a remote sink?
