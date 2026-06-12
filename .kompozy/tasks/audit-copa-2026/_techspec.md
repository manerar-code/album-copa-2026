# TechSpec — Álbum Copa 2026: Store Launch Readiness & Compliance

## Executive Summary

This specification covers the implementation of 13 audit items required to publish the
Álbum Copa 2026 app to the Apple App Store and Google Play Store. The work spans four
sequential phases: Infrastructure & Security (credentials, RLS, build config), Compliance &
Privacy (privacy policy screen and public URL, account deletion with 30-day grace period,
login error feedback), Store Readiness (iOS Privacy Manifest, asset validation, store
metadata), and Code Quality (React.memo optimization, ProfileModal extraction, CatalogProvider
decomposition, test library migration).

The primary technical trade-off is **breadth over depth**: this release deliberately avoids
new user-facing features (Expo SDK upgrade, analytics, push notifications) in favour of
closing every compliance and security gap before the store submission deadline. Each phase is
independently deployable; Phase 2 depends on Phase 1 (RLS must be live before account
deletion); Phase 3 depends on Phase 2 (privacy policy URL required for store listing). Phase 4
is independent of submission and runs last to avoid regression risk during compliance work.

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│  React Native App (Expo SDK 56)                              │
│                                                              │
│  src/core/                                                   │
│    navigation/RootNavigator.tsx  ← F11: extract ProfileModal │
│    providers/CatalogProvider.tsx ← F12: decompose into hooks │
│                                                              │
│  src/modules/                                                │
│    auth/                                                     │
│      components/ProfileModal.tsx ← F11 (new)                 │
│      components/PrivacyPolicyModal.tsx ← F4 (new)            │
│      screens/LoginScreen.tsx ← F6: add error feedback        │
│      services/accountDeletionService.ts ← F5 (new)          │
│      store/authStore.ts ← F5: add pendingDeletion field      │
│                                                              │
│  src/shared/                                                 │
│    components/StickerCard.tsx ← F10: add React.memo          │
│    components/CromoCard.tsx ← F10: add React.memo            │
│                                                              │
│  public/                                                     │
│    privacidade.html ← F4: static privacy policy (new)       │
│                                                              │
│  ios/                                                        │
│    PrivacyInfo.xcprivacy ← F7 (new)                          │
└─────────────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────────┐   ┌──────────────────────────────────┐
│  Supabase (Postgres) │   │  Supabase Edge Functions (Deno)  │
│                      │   │                                  │
│  user_collections    │   │  send-deletion-confirmation      │
│  user_albums         │   │  process-pending-deletions       │
│  account_deletion_   │   │    (daily cron via pg_cron)      │
│    requests ← F5 new │   └──────────────────────────────────┘
│                      │             │
│  RLS policies ← F2   │             ▼
└──────────────────────┘   ┌──────────────────────────────────┐
                            │  Resend (email API)              │
                            │  Free tier: 3,000 emails/month  │
                            └──────────────────────────────────┘
```

### External System Interactions

| System | Purpose | Auth Method |
|--------|---------|-------------|
| Supabase Postgres | Collection data, user albums, deletion requests | `anon` key (RLS-protected) / `service_role` key (Edge Functions only) |
| Supabase Auth | Google OAuth session management | Supabase JWT |
| Supabase Edge Functions | Deletion confirmation emails, scheduled cleanup | `service_role` Bearer token |
| Resend API | Transactional email delivery | `RESEND_API_KEY` secret (Edge Function env var) |
| EAS (Expo Application Services) | Encrypted secret store for build credentials | EAS CLI authentication |
| Vercel | Web deployment + static privacy policy page | GitHub integration / Vercel CLI |
| Apple App Store Connect | iOS submission metadata | Apple ID + Team ID (EAS managed) |
| Google Play Console | Android submission + Data Safety | Service account key (EAS secret) |

---

## Implementation Design

### Phase 1 — Infrastructure & Security

#### F1 — Credential & Secret Protection

**Current state:** `eas.json` stores `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` as plaintext in the `env` block of the `production` profile.
`supabase.ts` correctly reads from `process.env.EXPO_PUBLIC_*` — only the source (eas.json)
needs changing.

**Implementation steps:**

1. Create EAS secrets via CLI (one-time, run locally — values never committed):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://fmsojsxadjdigwppqnfa.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "<current-anon-key>"
```

2. Update `eas.json` production `env` block to reference secrets:
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
}
```

3. **Rotate the Supabase anon key** in the Supabase dashboard (Project Settings →
   API → Regenerate `anon` key). Update the EAS secret with the new value:
```bash
eas secret:push --scope project --env-file .env.production
```

4. Remove the `.env` file from git history using `git filter-repo` or
   `BFG Repo Cleaner`. Add `.env*` to `.gitignore` if not already present.

5. Verify `./secrets/service-account-key.json` is in `.gitignore`. This file is referenced
   in `eas.json` submit config and must not be committed. For CI: store as EAS secret and
   reference via `serviceAccountKeyPath: "$ANDROID_SERVICE_ACCOUNT_KEY_PATH"`.

6. Update `supabase.ts` to throw in development if env vars are missing:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Run: eas secret:pull --env-file .env');
}
```

**Files modified:** `eas.json`, `src/shared/services/supabase.ts`, `.gitignore`

---

#### F2 — Row-Level Security

**Current state:** `user_collections` and `user_albums` tables have RLS disabled.
Any authenticated user can read/write any other user's data.

**SQL to execute in Supabase SQL Editor:**

```sql
-- user_collections
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own collection"
  ON user_collections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_albums
ALTER TABLE user_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own albums"
  ON user_albums FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- account_deletion_requests (new table — F5)
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deletion request"
  ON account_deletion_requests FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Verification query** (run as a second authenticated user to confirm isolation):
```sql
-- Should return 0 rows when queried with a different user's auth token
SELECT COUNT(*) FROM user_collections WHERE user_id != auth.uid();
```

**Files modified:** None in the app. SQL executed directly in Supabase dashboard or via
migration file in `supabase/migrations/`.

---

#### F3 — Build Configuration Hardening

**Current state (`app.json`):**
- iOS `deploymentTarget: "16.4"` → must become `"17.0"` (required for Privacy Manifest)
- Android: no explicit `minSdkVersion` or `targetSdkVersion` (Expo SDK 56 defaults: min 24, target 34)
- Google Play requires `targetSdkVersion 35` for new submissions by August 2025

**Changes to `app.json`:**
```json
{
  "expo": {
    "ios": {
      "deploymentTarget": "17.0"
    },
    "android": {
      "minSdkVersion": 34,
      "targetSdkVersion": 35
    }
  }
}
```

Note: `versionCode: 1` and `buildNumber: "22"` are inconsistent. Recommended: increment
`versionCode` to 22 to match `buildNumber` before first store submission. This is a manual
decision — do not auto-increment here; record the decision separately.

**Files modified:** `app.json`

---

### Phase 2 — Compliance & Privacy

#### F4 — Privacy Policy Screen + Vercel Page

**In-app screen: `src/modules/auth/components/PrivacyPolicyModal.tsx`** (new file)

A full-screen `Modal` with a `ScrollView` containing the policy text in Brazilian Portuguese.
Receives `visible: boolean` and `onClose: () => void` props.

```typescript
// src/modules/auth/components/PrivacyPolicyModal.tsx
export function PrivacyPolicyModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Política de Privacidade</Text>
          <TouchableOpacity onPress={onClose} testID="close-button">
            <Text style={styles.closeBtn}>Fechar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Static policy text — last updated: 2026-06-10 */}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
```

**Access points:**
- `ProfileModal.tsx` (F11): add "Política de Privacidade" button; toggle `privacyVisible` state
- `LoginScreen.tsx`: add footer `TouchableOpacity` with `testID="privacy-policy-link"`

**Vercel static page:** Create `public/privacidade.html` at the project root. Since no
`vercel.json` exists, create one with a rewrite rule so the URL is clean:

```json
// vercel.json (new file)
{
  "rewrites": [
    { "source": "/privacidade", "destination": "/privacidade.html" }
  ]
}
```

The HTML file must include: app name, last updated date, data collected (email, name, avatar,
sticker collection), retention periods, LGPD rights (Art. 18), DPO contact email
(`manera@kbase.com.br`), and a link back to the app.

**Files created:** `src/modules/auth/components/PrivacyPolicyModal.tsx`, `public/privacidade.html`,
`vercel.json`
**Files modified:** `src/modules/auth/components/ProfileModal.tsx` (F11), `src/modules/auth/screens/LoginScreen.tsx`

---

#### F5 — Account Deletion with Grace Period

##### Data Model

```sql
CREATE TABLE account_deletion_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_delete_at TIMESTAMPTZ NOT NULL,
  cancelled_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);
```

##### Service Interface

```typescript
// src/modules/auth/services/accountDeletionService.ts
export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  scheduledDeleteAt: string;
  cancelledAt: string | null;
}

export const accountDeletionService = {
  async requestDeletion(userId: string, userEmail: string): Promise<DeletionRequest>,
  async cancelDeletion(userId: string): Promise<void>,
  async getPendingRequest(userId: string): Promise<DeletionRequest | null>,
};
```

`requestDeletion` inserts a row with `scheduled_delete_at = NOW() + INTERVAL '30 days'`,
then calls the `send-deletion-confirmation` Edge Function via
`supabase.functions.invoke('send-deletion-confirmation', { body: { email, userName, scheduledDeleteAt } })`.

##### UI Flow

1. `ProfileModal` — new "Solicitar exclusão de conta" button (red text, `testID="request-deletion-btn"`)
2. Opens a full-screen confirmation `Modal` explaining: 30-day grace, what is deleted, requires
   typing "EXCLUIR" in a `TextInput` (`testID="confirm-input"`)
3. "Confirmar exclusão" button enabled only when input value === "EXCLUIR"
4. On confirm: calls `accountDeletionService.requestDeletion()`, updates `authStore.pendingDeletion`
5. Grace period banner: if `authStore.pendingDeletion !== null`, render a sticky red banner at
   the top of the main app view (in `RootNavigator`) with "Conta com exclusão agendada — Cancelar"
6. "Cancelar" calls `accountDeletionService.cancelDeletion()`, clears `authStore.pendingDeletion`

##### authStore additions

```typescript
// additions to authStore
pendingDeletion: DeletionRequest | null;
setPendingDeletion: (req: DeletionRequest | null) => void;
```

On sign-in: `CatalogProvider.handleUserLogin` calls `accountDeletionService.getPendingRequest()`
and populates `authStore.pendingDeletion`. If `pendingDeletion` is found and
`scheduled_delete_at` has passed, the Edge Function has already deleted the account — sign
the user out immediately.

##### Edge Functions

**`supabase/functions/send-deletion-confirmation/index.ts`**
- Receives: `{ email, userName, scheduledDeleteAt }`
- Sends confirmation email via Resend with deletion date and cancellation instructions
- Returns `{ ok: true }` on success

**`supabase/functions/process-pending-deletions/index.ts`**
- Triggered by pg_cron daily at 02:00 UTC
- Queries rows where `scheduled_delete_at <= NOW()` and `completed_at IS NULL` and `cancelled_at IS NULL`
- For each: deletes `user_collections`, `user_albums`, calls `supabase.auth.admin.deleteUser(userId)`, sets `completed_at`
- Queries rows where reminder not yet sent and deletion is in ≤ 3 days: sends reminder email, sets `reminder_sent_at`

**Environment secrets (Supabase Edge Function secrets — not in code):**
- `RESEND_API_KEY` — set via `supabase secrets set RESEND_API_KEY=<key>`

**Files created:** `src/modules/auth/services/accountDeletionService.ts`,
`src/modules/auth/components/AccountDeletionModal.tsx`,
`supabase/functions/send-deletion-confirmation/index.ts`,
`supabase/functions/process-pending-deletions/index.ts`,
`supabase/migrations/YYYYMMDD_account_deletion_requests.sql`
**Files modified:** `src/modules/auth/store/authStore.ts`,
`src/modules/auth/components/ProfileModal.tsx`,
`src/core/navigation/RootNavigator.tsx` (grace period banner)

---

#### F6 — Login Error Feedback

**Current state:** `LoginScreen.tsx` has a silent `catch {}` — no user feedback on failure.

**Changes to `LoginScreen.tsx`:**

```typescript
const [loginError, setLoginError] = useState<string | null>(null);

const handleGoogleLogin = async () => {
  setLoading(true);
  setLoginError(null);
  try {
    await authService.signInWithGoogle();
  } catch (e: unknown) {
    const isNetworkError = e instanceof Error &&
      (e.message.includes('NetworkError') || e.message.includes('fetch'));
    const isCancelled = e instanceof Error && e.message.includes('cancelled');
    if (!isCancelled) {
      setLoginError(isNetworkError
        ? 'Sem conexão. Verifique sua internet e tente novamente.'
        : 'Não foi possível fazer login. Tente novamente.'
      );
      setTimeout(() => setLoginError(null), 6000);
    }
  } finally {
    setLoading(false);
  }
};
```

Error message rendered below the Google Sign-In button:
```tsx
{loginError && (
  <Text style={styles.errorText} testID="login-error">{loginError}</Text>
)}
```

Also: remove the dead code `onLoginSuccess` prop from `LoginScreen` (the prop exists but is
always called with `() => {}` from `RootNavigator` — auth state change handles navigation).

**Files modified:** `src/modules/auth/screens/LoginScreen.tsx`

---

### Phase 3 — Store Readiness

#### F7 — iOS Privacy Manifest

Create `ios/PrivacyInfo.xcprivacy` (XML property list format required by Apple):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

`CA92.1` reason: "Access info from the same app that wrote it" — covers AsyncStorage
(which uses `NSUserDefaults` under the hood on iOS).

To include in the Expo build, add to `app.json` iOS section:
```json
"ios": {
  "privacyManifests": {
    "NSPrivacyAccessedAPITypes": [
      {
        "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
        "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
      }
    ],
    "NSPrivacyTracking": false,
    "NSPrivacyTrackingDomains": [],
    "NSPrivacyCollectedDataTypes": []
  }
}
```

Using `app.json` `privacyManifests` (Expo SDK 50+) is preferred over a manually placed file
as it is processed correctly by `eas build`.

**Files created:** `ios/PrivacyInfo.xcprivacy`
**Files modified:** `app.json`

---

#### F8 — Asset Validation

Current `app.json` asset references:
- `icon`: `./assets/icon.png` (iOS app icon — must be 1024×1024 PNG, no alpha)
- `android.adaptiveIcon.foregroundImage`: `./assets/android-icon-foreground.png`
- `android.adaptiveIcon.backgroundImage`: `./assets/android-icon-background.png`
- `android.adaptiveIcon.monochromeImage`: `./assets/android-icon-monochrome.png`
- Splash screen image: `./assets/splash-icon.png`

**Validation checklist (manual step):**

| Asset | Required spec | Verification command |
|-------|--------------|----------------------|
| `icon.png` | 1024×1024 PNG, no alpha channel | `file assets/icon.png && identify assets/icon.png` |
| `android-icon-foreground.png` | 432×432 PNG, subject in 108×108dp safe zone | `identify assets/android-icon-foreground.png` |
| `android-icon-background.png` | 432×432 PNG or solid color | `identify assets/android-icon-background.png` |
| `android-icon-monochrome.png` | 432×432 PNG, single color | `identify assets/android-icon-monochrome.png` |
| `splash-icon.png` | Content visible on 9:16 and 4:3 ratios | Visual test on simulator |

If `identify` (ImageMagick) is not available: `sips -g pixelWidth -g pixelHeight <file>` on macOS.

**Files modified:** `assets/*.png` (replace if spec not met; no code changes)

---

#### F9 — Store Metadata

**No code changes.** All deliverables are submitted directly in App Store Connect and
Google Play Console. Items to prepare:

| Deliverable | Value |
|-------------|-------|
| App name | Álbum Copa 2026 |
| Android short description (30 chars) | `Monte seu álbum da Copa 2026` |
| Long description | See PRD F9 — ~300 words, offline-first, account sync |
| iOS keywords (100 chars) | `figurinhas,copa,album,panini,stickers,copa mundo,2026,futebol,colecao` |
| Category | Sports (both stores) |
| Privacy Policy URL | `https://album-copa-2026-sable.vercel.app/privacidade` |
| Release notes | `Versão inicial — Monte sua coleção da Copa do Mundo 2026` |
| Screenshots (iOS 6.7") | Min 3: Home stats, Album list, Team detail |
| Screenshots (Android phone) | Min 3: same screens |
| Data Safety (Google Play) | Manual form in Play Console — see below |

**Google Play Data Safety section fields:**

| Data type | Collected? | Purpose |
|-----------|-----------|---------|
| Email address | Yes | Account creation, deletion notifications |
| Name | Yes | Display name (from Google profile) |
| Photos (avatar) | No | Avatar URL is read from Google profile, not stored |
| App interactions (sticker collection) | Yes | App functionality — sync across devices |

**Files created:** None (metadata is entered in store consoles)

---

### Phase 4 — Code Quality

#### F10 — React.memo Optimization

**`StickerCard.tsx`:** Wrap with `React.memo`. The component already uses `useShallow`
for Zustand and `useCallback` for `handlePress` — memo is the final layer.

```typescript
// src/shared/components/StickerCard.tsx
export const StickerCard = React.memo(function StickerCard(props: StickerCardProps) {
  // existing implementation unchanged
});
StickerCard.displayName = 'StickerCard';
```

**`CromoCard.tsx`:** Wrap with `React.memo`. Pure presentational component — no store
subscriptions. All props are primitives or stable callbacks from `useCallback`.

```typescript
// src/shared/components/CromoCard.tsx
export const CromoCard = React.memo(function CromoCard(props: CromoCardProps) {
  // existing implementation unchanged
});
CromoCard.displayName = 'CromoCard';
```

**Verification:** React DevTools Profiler — tap one sticker, confirm only that card's
component highlights, not the entire FlatList.

**Files modified:** `src/shared/components/StickerCard.tsx`,
`src/shared/components/CromoCard.tsx`

---

#### F11 — ProfileModal Extraction

**Current state:** `RootNavigator.tsx` is 397 lines. The profile modal occupies lines ~154–243
with 14+ local state variables (`profileVisible`, `typeSettingsVisible`, `editing`,
`nickname`, `saving`, etc.) and handlers (`handleSaveNickname`, `handleSignOut`).

**New file:** `src/modules/auth/components/ProfileModal.tsx`

```typescript
// src/modules/auth/components/ProfileModal.tsx
interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
}

export function ProfileModal({ visible, onClose, onOpenPrivacyPolicy }: ProfileModalProps) {
  // Move all 14+ local state variables and handlers here
  // handleSaveNickname, handleSignOut, TypeSettingsModal trigger, etc.
}
```

After extraction, `RootNavigator.tsx` renders:
```tsx
<ProfileModal
  visible={profileVisible}
  onClose={() => setProfileVisible(false)}
  onOpenPrivacyPolicy={() => setPrivacyVisible(true)}
/>
<PrivacyPolicyModal
  visible={privacyVisible}
  onClose={() => setPrivacyVisible(false)}
/>
```

`RootNavigator.tsx` target size: ≤ 100 lines (navigation structure only).

**Files created:** `src/modules/auth/components/ProfileModal.tsx`
**Files modified:** `src/core/navigation/RootNavigator.tsx`

---

#### F12 — CatalogProvider Decomposition

**Current state:** `CatalogProvider.tsx` (315 lines) contains 6 distinct concerns
(onboarding, catalog load, auth bootstrap, user-album hydration, merge dialog, auth listener).

**Target structure:** Extract into 4 custom hooks + thin provider:

```typescript
// src/core/providers/hooks/useBootstrap.ts
// Concern 3: auth bootstrap with 8-second timeout + offlineQueueService.init()
export function useBootstrap(): { bootstrapComplete: boolean } {}

// src/core/providers/hooks/useCatalogLoad.ts
// Concern 2: initializeCatalog + checkForUpdates
export function useCatalogLoad(bootstrapComplete: boolean): { catalogReady: boolean } {}

// src/core/providers/hooks/useAuthListener.ts
// Concern 6: supabase.auth.onAuthStateChange (SIGNED_IN / SIGNED_OUT)
export function useAuthListener(onSignIn: (isNew: boolean) => void, onSignOut: () => void): void {}

// src/core/providers/hooks/useUserLogin.ts
// Concerns 4 + 5: user-album hydration + merge dialog state
export function useUserLogin(): {
  handleUserLogin: (user: AppUser, isNewLogin: boolean) => Promise<void>;
  mergeState: MergeState | null;
  handleMergeChoice: (choice: 'merge' | 'local' | 'cloud') => Promise<void>;
} {}
```

`CatalogProvider.tsx` becomes a thin orchestrator:
```typescript
export function CatalogProvider({ children }: Props) {
  const { bootstrapComplete } = useBootstrap();
  const { catalogReady } = useCatalogLoad(bootstrapComplete);
  const { handleUserLogin, mergeState, handleMergeChoice } = useUserLogin();
  useAuthListener(
    (isNew) => handleUserLogin(authStore.user!, isNew),
    () => { /* sign out cleanup */ }
  );
  if (!bootstrapComplete || !catalogReady) return <Loading />;
  return (
    <>
      <OnboardingProvider>{children}</OnboardingProvider>
      {mergeState && <MergeDialog {...mergeState} onChoice={handleMergeChoice} />}
    </>
  );
}
```

**Files created:** `src/core/providers/hooks/useBootstrap.ts`,
`src/core/providers/hooks/useCatalogLoad.ts`,
`src/core/providers/hooks/useAuthListener.ts`,
`src/core/providers/hooks/useUserLogin.ts`
**Files modified:** `src/core/providers/CatalogProvider.tsx`

---

#### F13 — Test Library Migration

**Current state:** `package.json` includes `"@testing-library/jest-native": "^5.4.3"` and
`jest.setupFilesAfterEnv` references `"@testing-library/jest-native/extend-expect"`.
`@testing-library/react-native` is at `^13.3.3` — v13+ includes all matchers natively.

**Steps:**

1. Remove `"@testing-library/jest-native/extend-expect"` from `setupFilesAfterEnv` in `package.json`:
```json
"jest": {
  "setupFilesAfterEnv": []
}
```

2. Remove `@testing-library/jest-native` from `devDependencies` in `package.json`.

3. Run `npm install` to update `package-lock.json`.

4. Run `npm test -- --coverage` to verify all tests pass with zero deprecation warnings.

If any test uses matchers that were only in `jest-native` and not in RNTL 13+, the test
will fail with `TypeError: expect(...).toHaveStyle is not a function`. Fix: update the
specific assertion to use RNTL's built-in equivalent (available since RNTL v12+).

**Files modified:** `package.json`

---

## Integration Points

### Supabase Edge Functions

- **Auth:** Service role key injected as `SUPABASE_SERVICE_ROLE_KEY` environment variable
  (automatically available in Supabase Edge Functions — no manual setup)
- **Resend:** `RESEND_API_KEY` set via `supabase secrets set`
- **Error handling:** Edge Functions return `{ ok: false, error: message }` on failure.
  The client handles failure gracefully — email delivery failure does not block account
  deletion request from being recorded.
- **Retry strategy:** Resend calls wrapped in try/catch with 3 retries (exponential back-off:
  1s, 2s, 4s) before marking email as failed.

### EAS Secrets

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon (public) key (rotated as part of F1)
- `ANDROID_SERVICE_ACCOUNT_KEY` — Google Play service account JSON content (store as file secret)

Access pattern: set once via `eas secret:create`, referenced as `"$VAR_NAME"` in `eas.json`.

---

## Data Models

### `account_deletion_requests` Table

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `auth.users.id` ON DELETE CASCADE |
| `requested_at` | TIMESTAMPTZ | No | `now()` | Insertion timestamp |
| `scheduled_delete_at` | TIMESTAMPTZ | No | — | `requested_at + INTERVAL '30 days'` |
| `cancelled_at` | TIMESTAMPTZ | Yes | NULL | Set on cancellation |
| `completed_at` | TIMESTAMPTZ | Yes | NULL | Set after permanent deletion |
| `reminder_sent_at` | TIMESTAMPTZ | Yes | NULL | Set after 3-day reminder email sent |

### `DeletionRequest` (TypeScript)

```typescript
export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;      // ISO 8601
  scheduledDeleteAt: string; // ISO 8601
  cancelledAt: string | null;
  completedAt: string | null;
}
```

---

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|------------|---------------------|-----------------|
| `eas.json` | Modified | Remove plaintext credentials → EAS secrets | F1 — must rotate key after removal |
| `app.json` | Modified | deploymentTarget 16.4→17.0; add minSdk 34, targetSdk 35; add privacyManifests | F3, F7 — test build after changes |
| `supabase.ts` | Modified | Add hard throw on missing env vars | F1 — low risk, dev-only guard |
| `user_collections` (DB) | Modified | Enable RLS + policy | F2 — test with multiple accounts before deploy |
| `user_albums` (DB) | Modified | Enable RLS + policy | F2 — same as above |
| `account_deletion_requests` (DB) | New | New table with RLS | F5 — migration required |
| `LoginScreen.tsx` | Modified | Add error state, remove dead `onLoginSuccess` prop | F6 — low regression risk |
| `RootNavigator.tsx` | Modified | Extract ProfileModal; add grace period banner | F11 — medium risk; test all modal flows |
| `CatalogProvider.tsx` | Modified | Decompose into 4 hooks | F12 — high risk; full regression test required |
| `StickerCard.tsx` | Modified | Wrap with React.memo | F10 — low risk; behavior unchanged |
| `CromoCard.tsx` | Modified | Wrap with React.memo | F10 — low risk; behavior unchanged |
| `ProfileModal.tsx` | New | Extracted from RootNavigator | F11, F4 — new component |
| `PrivacyPolicyModal.tsx` | New | In-app privacy policy screen | F4 — new component |
| `AccountDeletionModal.tsx` | New | Deletion confirmation flow | F5 — new component |
| `accountDeletionService.ts` | New | Deletion CRUD + Edge Function calls | F5 — new service |
| `authStore.ts` | Modified | Add `pendingDeletion` field | F5 — update all store usages |
| `package.json` | Modified | Remove `@testing-library/jest-native` | F13 — run full test suite after |
| `public/privacidade.html` | New | Static privacy policy page for Vercel | F4 — verify URL after deploy |
| `vercel.json` | New | Rewrite rule for /privacidade | F4 — verify after deploy |
| `supabase/functions/*` | New | 2 Edge Functions | F5 — test with Supabase CLI locally |
| `ios/PrivacyInfo.xcprivacy` | New | iOS Privacy Manifest | F7 — required for App Store |

---

## Testing Approach

### Unit Tests

**F5 — accountDeletionService:**
- `requestDeletion` → inserts row + calls Edge Function; mock `supabase.from().insert()` and `supabase.functions.invoke()`
- `cancelDeletion` → updates `cancelled_at`; mock `supabase.from().update()`
- `getPendingRequest` → returns null when no row; returns row when found

**F6 — LoginScreen error feedback:**
- Network error caught → renders error text with `testID="login-error"`
- Cancelled auth → no error rendered
- Unknown error → renders generic error text
- Error auto-dismisses after 6 seconds (mock `setTimeout`)
- Mock `authService.signInWithGoogle` to throw controlled errors

**F10 — React.memo:**
- Wrap with `React.memo` → verify `displayName` is set (prevents unnamed component in DevTools)
- No behavioral test required; memo is verified via profiler, not unit tests

**F11 — ProfileModal:**
- All existing modal behaviors continue to pass after extraction
- Test in isolation: renders, nickname editing, sign out, TypeSettings open
- `RootNavigator` test: renders `ProfileModal` when `profileVisible` is true

**F12 — CatalogProvider hooks:**
- `useBootstrap`: mock `authService.getCurrentUser`, verify 8-second timeout triggers
- `useCatalogLoad`: mock `catalogService.load`, verify fallback to remote on cache miss
- `useAuthListener`: mock `supabase.auth.onAuthStateChange`, verify SIGNED_IN/SIGNED_OUT callbacks

**F13 — Test migration:**
- Run `npm test -- --coverage` as the sole verification — no new tests required

### Integration Tests

**F2 — RLS:**
- Create two test users in Supabase; user A creates a collection; user B queries for user A's
  collection — expects 0 rows returned.
- Run manually in Supabase SQL Editor or via `supabase test db` if test suite exists.

**F5 — Account deletion flow end-to-end:**
- User requests deletion → row created in `account_deletion_requests`
- User logs out and back in within 30 days → pending deletion banner visible
- User cancels → `cancelled_at` set, banner hidden
- Cannot automate Edge Function daily cron; test manually by setting `scheduled_delete_at`
  to `now()` and invoking the function directly via Supabase dashboard.

**F7 — iOS Privacy Manifest:**
- Verified by `eas build --platform=ios --profile=production` — Apple validates the manifest
  during review; no local integration test possible.

---

## Development Sequencing

### Build Order

1. **F1 — Credential protection** — no dependencies; modifies `eas.json` and `supabase.ts`;
   rotate Supabase anon key; verify `npm run lint` passes
2. **F3 — Build config hardening** — depends on step 1 (build environment stable);
   modify `app.json`; verify `eas build` compiles without error
3. **F2 — RLS policies** — depends on steps 1-2 (stable credentials required to test RLS);
   run SQL in Supabase; verify with multi-user test
4. **F6 — Login error feedback** — no dependencies on Phase 1 (standalone UI change);
   can be done in parallel with steps 1-3; modify `LoginScreen.tsx`
5. **F4 — Privacy Policy screen + Vercel page** — no dependencies on Phase 1; create
   `PrivacyPolicyModal.tsx`, `public/privacidade.html`, `vercel.json`; deploy and verify URL
6. **F5 — Account deletion** — depends on step 3 (RLS must be live); create
   `account_deletion_requests` table; implement service + UI + Edge Functions
7. **F7 — iOS Privacy Manifest** — depends on steps 1-3 (app.json must be stable);
   add `privacyManifests` to `app.json`; verify with iOS build
8. **F8 — Asset validation** — independent; validate and replace assets as needed
9. **F9 — Store metadata** — depends on step 5 (privacy policy URL must be live);
   enter metadata in App Store Connect and Google Play Console
10. **F11 — ProfileModal extraction** — no dependencies on earlier phases; extract from
    `RootNavigator.tsx`; all modal tests must still pass
11. **F10 — React.memo** — depends on step 10 (ProfileModal must be stable before StickerCard
    changes, to isolate regressions); wrap `StickerCard` and `CromoCard`
12. **F12 — CatalogProvider decomposition** — depends on step 11 (all modal flows verified
    before touching the provider); extract 4 hooks; full regression test
13. **F13 — Test migration** — depends on step 12 (all tests must be passing before removing
    testing library); remove `@testing-library/jest-native`; run full coverage check

### Technical Dependencies

| Dependency | Required by | Status |
|-----------|------------|--------|
| Supabase anon key rotated | F1 EAS secrets | Must happen atomically with Vercel env update |
| RLS enabled on `user_collections`/`user_albums` | F5 account deletion | Phase 1 must deploy first |
| `account_deletion_requests` migration applied | F5 UI + service | Migration before app deploy |
| Resend account + API key | F5 Edge Function | Create at https://resend.com before writing Edge Function |
| `public/privacidade.html` deployed to Vercel | F9 metadata | URL must be live before store submission |
| Supabase pg_cron extension enabled | F5 scheduled cleanup | Enable in Supabase: `CREATE EXTENSION IF NOT EXISTS pg_cron` |
| `@testing-library/react-native ^13.4` | F13 migration | Check: `npm ls @testing-library/react-native` — upgrade if < 13.4 |

---

## Monitoring and Observability

### Key Metrics

| Metric | Where to check | Alert threshold |
|--------|---------------|-----------------|
| Edge Function errors | Supabase Dashboard → Functions → Logs | Any 5xx error |
| Resend delivery rate | Resend dashboard | < 95% delivery rate |
| Pending deletions older than 35 days | Supabase SQL: `SELECT COUNT(*) FROM account_deletion_requests WHERE scheduled_delete_at < NOW() - INTERVAL '5 days' AND completed_at IS NULL` | > 0 rows |
| RLS policy violations | Supabase Dashboard → Logs → Postgres | Any policy rejection from app user |

### Log Events

All existing `logger.ts` conventions apply. Add the following for new services:

```typescript
// accountDeletionService.ts
logger.info('deletion:requested', { userId, scheduledDeleteAt });
logger.info('deletion:cancelled', { userId });
logger.warn('deletion:email_failed', { userId, error: e.message });
```

---

## Technical Considerations

### Key Decisions

**1. Dedicated table for deletion state (ADR-002)**
- Decision: `account_deletion_requests` table
- Rationale: queryable by Edge Functions, auditable for LGPD, proper RLS isolation
- Trade-off: one additional migration and RLS policy

**2. Supabase Edge Function + Resend for emails (ADR-003)**
- Decision: Edge Function + Resend free tier
- Rationale: no new npm package in the mobile app; secrets stay server-side; Resend free
  tier is sufficient for launch volume
- Trade-off: Deno runtime knowledge required; Resend account dependency

**3. Static HTML for /privacidade (ADR-004)**
- Decision: `public/privacidade.html` + `vercel.json` rewrite
- Rationale: zero build-time complexity, immediate CDN delivery, no navigation changes
- Trade-off: policy text duplicated between in-app component and HTML file

**4. Custom hooks over separate Context providers (F12)**
- Decision: 4 custom hooks (`useBootstrap`, `useCatalogLoad`, `useAuthListener`, `useUserLogin`)
  rather than 4 separate React Contexts
- Rationale: Contexts add indirection and boilerplate; the existing CatalogContext is not
  consumed outside `CatalogProvider`; hooks are independently testable with `renderHook`
- Rejected: separate Context providers (more complex, no benefit for single-consumer design)

**5. `deploymentTarget: "17.0"` requirement**
- Decision: upgrade iOS minimum from 16.4 to 17.0
- Rationale: Apple requires Privacy Manifest for iOS 17+ apps; while the manifest can
  technically be included for apps targeting iOS 16, reviewer tooling is calibrated for 17+
- Trade-off: excludes iOS 16.x users (~3% of iOS market as of June 2026)

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Supabase anon key rotation breaks Vercel web app | High | Rotate key and update Vercel env var in the same deploy; use a maintenance window |
| RLS changes break existing multi-album sync | Medium | Test with 2+ Supabase accounts before deploying Phase 1; have rollback SQL ready |
| CatalogProvider decomposition introduces boot regression | Medium | Write tests for each hook before refactoring; keep original as backup until tests pass |
| Apple rejects Privacy Manifest format | Low | Use `app.json privacyManifests` (Expo-managed) — Expo validates format during build |
| pg_cron not available on Supabase free tier | Low | Verify: Supabase Pro and above include pg_cron; free tier may require manual workaround (HTTP cron via external service like cron-job.org) |

---

## Architecture Decision Records

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Implement all 14 audit items in 4 sequential phases to minimize risk for a solo-developer project
- [ADR-002: Dedicated Table for Account Deletion State](adrs/adr-002.md) — Use a dedicated `account_deletion_requests` table rather than `user_metadata` or an existing table column, for auditability and proper RLS isolation
- [ADR-003: Supabase Edge Function + Resend for Deletion Emails](adrs/adr-003.md) — Deliver deletion confirmation and reminder emails via Supabase Edge Functions calling the Resend API free tier
- [ADR-004: Static HTML for Vercel /privacidade Privacy Policy Page](adrs/adr-004.md) — Serve the public privacy policy as a static HTML file via Vercel rather than an Expo web route or serverless function
