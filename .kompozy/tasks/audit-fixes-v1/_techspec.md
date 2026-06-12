# TechSpec: Audit Fixes v1 — Álbum Copa 2026

## Executive Summary

This TechSpec implements all 31 audit findings from the June 2026 technical audit of the Álbum Copa 2026 React Native + Expo app. The implementation is sequenced across three phases: Phase 1 resolves the iOS black screen (6 root causes), Phase 2 achieves App Store and Google Play readiness (11 fixes), and Phase 3 delivers quality and performance improvements (14 fixes).

The primary trade-off is **correctness over new features**: every change is a targeted surgical fix to an existing file. No new screens, navigation flows, or data models are introduced. The most structurally impactful changes are the addition of `expo-splash-screen` (requires module-level call in `App.tsx`), removal of `react-native-worklets` (requires `npm uninstall` + clean build), and the Sign in with Apple integration (requires Apple Developer Portal configuration as a blocking manual step).

---

## System Architecture

### Component Overview

The app uses a provider-first architecture:

```
App.tsx
  └─ GestureHandlerRootView        [NEW - F1.3]
       └─ CatalogProvider          [MODIFIED - F1.4, F2.5, F2.6, F2.11]
            └─ OnboardingContext
                 └─ SyncStatusBar
                 └─ RootNavigator  [MODIFIED - F3.5]
                      └─ Bottom Tabs (Home, Album, Missing, Duplicates)
```

**Affected services:**
- `authService.ts` — session validation method change (F2.6), new `signInWithApple()` method (F2.1)
- `cloudCollectionService.ts` — insert error propagation (F2.7)
- `syncService.ts` — memory leak + concurrency guard (F2.8)
- `catalogService.ts` — offline fallback (F2.5)
- `stickerStore.ts` — rollback fix + resetCollection guard (F2.4, F3.2)
- `logger.ts` — production guard (F3.1)
- `offlineQueueService.ts` — pre-init guard (F3.10)

**Affected config files:**
- `App.tsx` — splash screen + GestureHandlerRootView (F1.1, F1.3)
- `app.json` — splash block, cleanup (F2.3, F3.11)
- `eas.json` — Xcode image, Android autoIncrement (F1.5, F2.2)
- `plugins/withFollyFix.js` — idempotency fix (F1.6)
- `package.json` — worklets removal, babel-preset-expo to devDeps (F1.2, F3.4)
- `metro.config.js` + jest config — alias cleanup (F3.3)

---

## Implementation Design

### Core Interfaces

#### F1.1 — App.tsx with expo-splash-screen

```typescript
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Module-level: prevent auto-hide before fonts load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ /* ... existing fonts ... */ });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null; // splash still visible

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <CatalogProvider>
        <RootNavigator />
      </CatalogProvider>
    </GestureHandlerRootView>
  );
}
```

**Notes:**
- `preventAutoHideAsync()` is called at module scope (outside the component).
- `hideAsync()` is called inside `useEffect` triggered when `fontsLoaded || fontError`.
- When splash is visible, `App` returns `null` — no black flash.
- `GestureHandlerRootView` wraps the entire tree (fixes HIGH-01).
- The existing `styles.loading` ActivityIndicator view is removed (no longer needed).

#### F1.4 — CatalogProvider bootstrap with timeout safeguard

```typescript
const BOOTSTRAP_TIMEOUT_MS = 8000;

const bootstrap = async () => {
  const timeoutPromise = new Promise<void>(resolve =>
    setTimeout(() => { resolve(); }, BOOTSTRAP_TIMEOUT_MS)
  );

  let user = null;
  try {
    await Promise.race([
      (async () => {
        await offlineQueueService.init().catch(() => {});
        user = await authService.getCurrentUser();
        if (user) authStore.setUser(user);
      })(),
      timeoutPromise,
    ]);
  } catch (err) {
    logger.warn('Bootstrap auth error:', err);
  } finally {
    authStore.setLoading(false);
  }

  try {
    await initializeCatalog();
    await store.loadCollection();
    const allTypes = Array.from(new Set(store.figurinhas.map(f => f.type).filter(Boolean)));
    await userSettings.loadSettings(allTypes);
    if (user) {
      bootstrapSyncedUserId.current = user.id;
      await handleUserLogin(user.id, user.name);
      syncService.start(user.id);
    }
  } catch (err) {
    logger.error('Bootstrap catalog/sync error:', err);
    store.setLoading(false); // F2.11: ensure stickerStore loading is cleared
  }
};
```

#### F2.1 — authService.signInWithApple

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

async signInWithApple(): Promise<AppUser> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
  });
  if (error) throw error;
  const u = data.user!;
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.email ?? 'Usuário',
    avatar_url: u.user_metadata?.avatar_url,
  };
}
```

#### F2.4 — stickerStore toggleSticker rollback fix

```typescript
// BEFORE (bug): uses stale closure variable
} catch (error) {
  set({ collection }); // collection is captured at toggle start — stale on double-tap
}

// AFTER (fix): reads current state at rollback time
} catch (error) {
  set({ collection: get().collection }); // no-op rollback (state already correct)
  // OR restore pre-toggle state:
  set({ collection: previousCollection }); // use const previousCollection = get().collection at top
}
```

**Correct pattern:**
```typescript
toggleSticker: async (figurinhaId: string) => {
  const previousCollection = get().collection; // snapshot before mutation
  // ... optimistic update ...
  try {
    // ... persist ...
  } catch (error) {
    set({ collection: previousCollection }); // restore from snapshot
  }
}
```

#### F2.7 — cloudCollectionService replaceAll error check

```typescript
async replaceAll(userAlbumId: string, collection: UserCollection, userId: string): Promise<void> {
  try {
    await supabase.from('user_collections').delete().eq('user_album_id', userAlbumId);
    const rows = Object.entries(collection)
      .filter(([, status]) => status !== 'missing')
      .map(([figurinha_id, status]) => ({
        user_id: userId,
        user_album_id: userAlbumId,
        figurinha_id,
        status,
        updated_at: new Date().toISOString(),
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from('user_collections').insert(rows);
      if (error) throw error; // propagate instead of silently ignoring
    }
  } catch (error) {
    throw handleError(error, 'cloudCollectionService.replaceAll');
  }
}
```

#### F2.8 — syncService isFlushing guard + stop-before-start

```typescript
const createSyncService = () => {
  let unsubscribe: (() => void) | null = null;
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let currentUserId: string | null = null;
  let isFlushing = false; // NEW

  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
    currentUserId = null;
    isFlushing = false; // reset on stop
  };

  const tryFlush = async () => {
    if (isFlushing || !currentUserId) return; // NEW guard
    isFlushing = true;
    try {
      // ... existing flush logic ...
    } finally {
      isFlushing = false; // always reset
    }
  };

  const start = (userId: string) => {
    if (currentUserId) stop(); // NEW: stop previous before restarting
    currentUserId = userId;
    // ... existing NetInfo subscription + polling fallback ...
  };

  return { start, stop };
};
```

---

### Data Models

No new data models or database schema changes are introduced. All fixes operate on existing types:

- `UserCollection: Record<string, StickerStatus>` — unchanged
- `AppUser: { id, email, name, avatar_url }` — unchanged; Sign in with Apple maps to same shape
- `user_collections` Supabase table — unchanged; `replaceAll` fix only adds error checking

---

### API Endpoints

No new API endpoints. External service changes:

**Supabase — Apple OAuth provider (F2.1):**
- Enable Apple provider in Supabase Dashboard → Authentication → Providers
- Configure: Service ID (`com.manera.albumcopa2026`), Team ID (`L6S357D7QC`), Key ID, private key (.p8 file)
- Callback URL: `https://fmsojsxadjdigwppqnfa.supabase.co/auth/v1/callback` (already configured for Google)

**Supabase — authService.getCurrentUser (F2.6):**
- Replace `supabase.auth.getSession()` → `supabase.auth.getUser()`
- `getUser()` validates the token server-side on each call; `getSession()` only checks local cache

---

## Integration Points

### expo-splash-screen (NEW — F1.1, F2.3)
- **Purpose:** Prevent native iOS splash from dismissing before JS bundle is ready
- **Auth:** None — local Expo package
- **Error handling:** `hideAsync()` is idempotent; calling it multiple times is safe

### expo-apple-authentication (NEW — F2.1)
- **Purpose:** Native Sign in with Apple sheet on iOS
- **Auth:** Apple Identity Token → Supabase `signInWithIdToken`
- **Error handling:** `AppleAuthentication.signInAsync` throws `ERR_REQUEST_CANCELED` if user cancels — catch and ignore; throw all other errors to the login UI

### Apple Developer Portal (MANUAL — F2.1)
- Enable Sign in with Apple capability on App ID `com.manera.albumcopa2026`
- Create Service ID and private key (.p8) for Supabase configuration
- **Blocking dependency:** Must be done before Phase 2 build

### Google Play Console (MANUAL — F2.2)
- Create service account with "Release Manager" role
- Download JSON key to `secrets/service-account-key.json`
- **Blocking dependency:** Must exist before `eas submit --platform android`

---

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `App.tsx` | Modified | Add SplashScreen + GestureHandlerRootView. **Risk: medium** — module-level call pattern is non-standard | Test cold launch on physical iPhone after change |
| `package.json` | Modified | Remove `react-native-worklets`, move `babel-preset-expo` to devDeps | Run `npm install` + `eas build --clear-cache` |
| `eas.json` | Modified | Xcode image change (26.1 → 15.4), add Android autoIncrement | Rebuild after change |
| `plugins/withFollyFix.js` | Modified | Fix B gsub idempotency. **Risk: low** — guards against double-run | Verify Podfile output in build logs |
| `CatalogProvider.tsx` | Modified | Bootstrap timeout + unified finally. **Risk: low** — behavior preserved | Test with network disabled on device |
| `authService.ts` | Modified | `getSession` → `getUser`, add `signInWithApple`. **Risk: medium** — session behavior change | Test login/logout cycle on device |
| `cloudCollectionService.ts` | Modified | Insert error propagation. **Risk: low** — only adds error throw | Unit test replaceAll failure path |
| `syncService.ts` | Modified | isFlushing flag + stop-before-start. **Risk: low** — guards concurrent calls | Test rapid network toggle on device |
| `catalogService.ts` | Modified | Offline fallback on fetchAndCacheFullCatalog. **Risk: low** | Test launch with airplane mode |
| `stickerStore.ts` | Modified | Rollback snapshot fix + resetCollection try/catch. **Risk: low** | Unit test double-tap scenario |
| `logger.ts` | Modified | __DEV__ guard on warn/error. **Risk: low** | Verify no logs in production build |
| `app.json` | Modified | Add splash block, remove experiments. **Risk: low** | Build and verify splash appears |
| `metro.config.js` / jest | Modified | @app alias cleanup. **Risk: low** | Run test suite after change |
| `AlbumListScreen.tsx` | Modified | getItemLayout + useCallback. **Risk: low** | Visual regression test on scroll |
| Multiple store consumers | Modified | Zustand field selectors. **Risk: medium** — behavior change in rendering | Run full regression on web + device |
| `RootNavigator.tsx` | Modified | typeof window guard. **Risk: low** — already has Platform.OS check | Run web and native builds |
| `CromoCard.tsx`, `AlbumListScreen.tsx`, etc. | Modified | accessibilityLabel additions. **Risk: low** | VoiceOver test on iOS |
| `offlineQueueService.ts` | Modified | Pre-init warning guard. **Risk: low** | Unit test enqueue before init |

---

## Testing Approach

### Unit Tests

**F2.4 — toggleSticker rollback:**
- Mock `cloudCollectionService.upsertOne` to throw
- Verify state is restored to `previousCollection` after throw
- Verify double-tap does not produce inconsistent state (use 300ms debounce mock)

**F2.7 — replaceAll error propagation:**
- Mock Supabase insert to return `{ error: { message: 'insert failed' } }`
- Verify `replaceAll` throws and does not silently return
- Verify caller catch block receives the error

**F2.8 — syncService isFlushing:**
- Call `tryFlush()` twice in rapid succession (no await between calls)
- Verify `offlineQueueService.flush` is called exactly once

**F3.1 — logger production guard:**
- Mock `__DEV__` as `false`
- Call `logger.warn('test')` and `logger.error('test')`
- Verify `console.warn` and `console.error` are NOT called

**F2.5 — catalogService offline fallback:**
- Mock `getAlbum()` to throw network error
- Mock `loadCacheLocally()` to return valid cache
- Verify `fetchAndCacheFullCatalog` returns cached data without throwing

**F3.3 — @app alias:**
- Run `jest --listTests` and verify no `@app/*` import errors in test output

### Integration Tests

**F1.1 + F1.3 — Splash + GestureHandler (manual, device):**
1. Install Phase 1 build on physical iPhone via TestFlight
2. Cold launch: verify splash with logo appears, then dismisses to Home screen
3. Verify no black screen across 3 consecutive cold launches

**F2.1 — Sign in with Apple (manual, device):**
1. Tap "Sign in with Apple" button
2. Verify native Apple auth sheet appears
3. Authenticate → verify user is logged in and collection syncs

**F2.5 — Offline launch (manual, device):**
1. Enable airplane mode
2. Cold launch app
3. Verify Home screen renders with cached catalog (no crash)

**F2.6 — Session expiry (manual, device):**
1. Log in, then invalidate session via Supabase dashboard
2. Tap any action requiring auth
3. Verify app signs out and shows login screen

---

## Development Sequencing

### Build Order

**Phase 1 — iOS Black Screen (no blocking external dependencies):**

1. **F1.2** — Remove `react-native-worklets` from `package.json`. Run `npm install`. *(No dependencies)*
2. **F1.5** — Change `eas.json` iOS image to `macos-sonoma-14.4-xcode-15.4`. *(No dependencies)*
3. **F1.6** — Fix `withFollyFix.js` gsub idempotency. *(No dependencies)*
4. **F1.1 + F2.3** — Install `expo-splash-screen`, update `App.tsx` with `preventAutoHideAsync`/`hideAsync`, add `splash` block to `app.json`. *(Depends on step 1 — clean npm install must be done first)*
5. **F1.3** — Add `GestureHandlerRootView` wrapper to `App.tsx`. *(Depends on step 4 — same file)*
6. **F1.4 + F2.11** — Refactor `CatalogProvider` bootstrap with `Promise.race` timeout + unified finally. *(No dependency on above steps — parallel with 4-5)*
7. **EAS Build Phase 1** — `npx eas build --platform ios --profile production --clear-cache`. *(Depends on steps 1–6)*
8. **Validate** — Install on TestFlight, verify no black screen.

**Phase 2 — Store Readiness (blocking external deps: Apple Developer Portal, Google Play Console):**

9. **F2.10** — Fix `lint` npm script (remove `--ext` flag). *(No dependencies)*
10. **F2.4** — Fix `toggleSticker` rollback snapshot + add 300ms debounce to tap handler. *(No dependencies)*
11. **F2.5** — Add offline fallback to `catalogService.fetchAndCacheFullCatalog` and `checkVersion`. *(No dependencies)*
12. **F2.7** — Add insert error check to `cloudCollectionService.replaceAll`. *(No dependencies)*
13. **F2.8** — Add `isFlushing` flag and `stop()`-before-`start()` to `syncService`. *(No dependencies)*
14. **F2.6** — Replace `getSession()` with `getUser()` in `authService.getCurrentUser`. *(No dependencies)*
15. **F2.1** — Install `expo-apple-authentication`, add `signInWithApple()` to `authService`, add Apple button to login UI. *(Depends on step 14 — auth service must be stable; BLOCKS on Apple Developer Portal configuration)*
16. **F2.2** — Add `autoIncrement: true` to `eas.json` Android production block. Add `secrets/` dir. *(Depends on Google Play Console service account key — manual step)*
17. **F2.9** — Update privacy policy page on Vercel deployment. *(Manual — no code change)*
18. **EAS Build Phase 2** — `npx eas build --platform ios --profile production` + `npx eas build --platform android --profile production`. *(Depends on steps 9–16)*
19. **Submit** — `npx eas submit --platform ios --latest` + `npx eas submit --platform android --latest`. *(Depends on step 18)*

**Phase 3 — Quality and Polish:**

20. **F3.1** — Apply `__DEV__` guard to `logger.warn` and `logger.error`. Replace `console.warn` in `supabase.ts`. *(No dependencies)*
21. **F3.2** — Add `try/catch` + rollback to `stickerStore.resetCollection`. *(No dependencies)*
22. **F3.3** — Remove residual `@app/*` imports; update jest `moduleNameMapper`. *(No dependencies)*
23. **F3.4** — Move `babel-preset-expo` to `devDependencies`. *(No dependencies)*
24. **F3.5** — Add `typeof window !== 'undefined'` guard to `RootNavigator.tsx` window references. *(No dependencies)*
25. **F3.8** — Create `crossPlatformAlert()` helper in `src/shared/utils/`. Update `StickerCard.handlePress` to use it + `useCallback`. *(No dependencies)*
26. **F3.6** — Add `getItemLayout` + `useCallback`/`useMemo` to `AlbumListScreen`. *(No dependencies)*
27. **F3.7** — Replace full store destructuring with field selectors in `StickerCard`, `ScreenHeader`, `HomeScreen`, `AlbumListScreen`, `UserAlbumsModal`. *(Depends on step 26 — same files, avoid conflicts)*
28. **F3.9** — Add `accessibilityLabel` + `accessibilityRole="button"` to `CromoCard`, `RootNavigator`, `AlbumListScreen`, `UserAlbumsModal`. *(No dependencies)*
29. **F3.10** — Add pre-init warning guard to `offlineQueueService.enqueue`. *(No dependencies)*
30. **F3.11** — Remove `experiments.typedRoutes` block from `app.json`. Set `predictiveBackGestureEnabled: true`. *(No dependencies)*
31. **EAS Build Phase 3** — `npx eas build --platform ios --profile production` + Android. Submit as patch update.

### Technical Dependencies

**Blocking before Phase 2:**
- **Apple Developer Portal:** Sign in with Apple capability enabled on App ID `com.manera.albumcopa2026`; Service ID and .p8 private key created and configured in Supabase Dashboard
- **Google Play Console:** App listing created; service account JSON key at `secrets/service-account-key.json`
- **Privacy Policy:** Updated page deployed to `https://album-copa-2026-sable.vercel.app/privacy-policy`

**Non-blocking:**
- EAS CLI version ≥ 16.0.0 (already enforced in `eas.json`)
- Node.js ≥ 18 (Expo SDK 56 requirement)

---

## Monitoring and Observability

**Phase 1 validation checklist (manual):**
- Cold launch: splash visible → dismisses → Home screen renders (3× passes)
- No crash on fast double-tap of a sticker card
- App opens in airplane mode (cached catalog)

**Phase 2 validation checklist (manual):**
- Sign in with Apple sheet appears on iOS, completes successfully
- Session expiry triggers logout (test via Supabase dashboard invalidation)
- Android build submitted to Play Console without `versionCode` conflict

**Production observability (Phase 3):**
- `logger.warn` and `logger.error` are silent in production builds — no PII leaks via console
- `offlineQueueService.enqueue` logs a dev-only warning if called before `init()`

---

## Technical Considerations

### Key Decisions

**SplashScreen at module scope (F1.1):**
`SplashScreen.preventAutoHideAsync()` must be called outside the React component tree, at module evaluation time. If called inside `useEffect`, there is a race condition where the native splash may auto-hide before the `useEffect` runs. Trade-off: slightly unconventional module-level side effect, but required by the Expo SDK contract.

**Promise.race timeout in bootstrap (F1.4):**
The timeout resolves (not rejects) so it does not trigger the `catch` path. The 8-second value provides a safe upper bound for Supabase `getUser()` on a slow connection without feeling sluggish on normal networks. If the timeout fires, the app proceeds unauthenticated — the user can log in manually.

**getUser() vs getSession() (F2.6):**
`getSession()` reads from the local AsyncStorage cache and does not validate the token with the Supabase server. On first call after a long offline period, the token may be expired but `getSession()` returns it as valid. `getUser()` makes a network round-trip to validate. Trade-off: adds ~200ms to bootstrap on every cold launch but eliminates silent 401 failures.

**withFollyFix idempotency (F1.6):**
The current Fix B runs `gsub!('weak let ', 'weak var ')` followed by `gsub!('weak var ', 'nonisolated(unsafe) weak var ')`. On a clean source, this transforms `weak let x` → `weak var x` → `nonisolated(unsafe) weak var x` (correct). On a pre-patched source, `nonisolated(unsafe) weak var x` → `nonisolated(unsafe) nonisolated(unsafe) weak var x` (broken). Fix: replace both gsubs with a single regex: `gsub!(/\bweak let /, 'nonisolated(unsafe) weak var ')` and add a guard `next if content.include?('nonisolated(unsafe)')`.

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| `macos-sonoma-14.4-xcode-15.4` not compatible with reanimated 4.3.1 | Low | Check Expo infrastructure docs before build; fallback to `macos-sequoia-15.3-xcode-16.3` |
| `expo-apple-authentication` throws non-cancellation errors silently | Low | Wrap in try/catch, show error toast; log in dev only |
| `getUser()` causes noticeable bootstrap slowdown on poor networks | Medium | 8s timeout in Promise.race guarantees app renders regardless |
| Phase 2 rejected by App Store for reason other than Guideline 4.8 | Low | Review App Store Connect metadata completeness before submission |
| Removing `react-native-worklets` breaks an animation not covered by tests | Low | Smoke test all animated screens (CromoCard, AlbumListScreen) after Phase 1 build |

---

## Architecture Decision Records

- [ADR-001: Three-Phase Rollout for Audit Fixes](adrs/adr-001.md) — Fixes delivered in three phases (black screen → store readiness → quality) rather than big bang.
- [ADR-002: expo-splash-screen with preventAutoHideAsync/hideAsync Pattern](adrs/adr-002.md) — Native splash managed via module-level `preventAutoHideAsync` and font-gated `hideAsync`.
- [ADR-003: Sign in with Apple via expo-apple-authentication + signInWithIdToken](adrs/adr-003.md) — Native Apple auth sheet with Supabase `signInWithIdToken` instead of OAuth redirect.
- [ADR-004: cloudCollectionService.replaceAll — Check Insert Error and Throw](adrs/adr-004.md) — Error propagation fix over upsert or transaction approaches.
- [ADR-005: Logger Production Guard — __DEV__ on warn and error](adrs/adr-005.md) — Suppress production logs via `__DEV__` guard; no Sentry integration in this scope.
