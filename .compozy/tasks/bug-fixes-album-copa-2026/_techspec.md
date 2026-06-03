# TechSpec: Bug Fixes — Álbum Copa 2026

**Version:** 1.0
**Date:** 2026-06-02
**Status:** Draft
**PRD Reference:** `_prd.md`

---

## Executive Summary

This TechSpec describes the targeted code changes required to resolve all 10 bugs documented in the PRD. Every fix is a surgical edit to an existing file — no new packages, no new directories, and no schema changes. The primary trade-off is that all changes ship together in a single build (ADR-001), which means all fixes must pass local web regression before a new EAS build is triggered. The most architecturally significant change is BUG-07 (cross-album duplicate signaling), which adds a selector to `stickerStore.ts` and modifies sticker card interaction logic.

---

## System Architecture

No architectural changes. All fixes operate within the existing layer model:

```
src/
├── core/navigation/RootNavigator.tsx   → BUG-01, BUG-02, BUG-03, BUG-06
├── modules/
│   ├── auth/components/
│   │   ├── UserAlbumsModal.tsx         → BUG-04, BUG-05
│   │   └── TypeSettingsModal.tsx       → BUG-09, BUG-10
│   └── album/
│       ├── store/stickerStore.ts       → BUG-07 (selector)
│       └── components/StickerCard.tsx  → BUG-07 (highlight + tap)
└── shared/store/userSettingsStore.ts   → BUG-08, BUG-09
```

---

## Component Design

### BUG-01 — iOS Black Screen

**File:** `eas.json` + `app.json`

The black screen on TestFlight is caused by a combination of `newArchEnabled: false` with `react-native-reanimated@4.3.1`, which requires the New Architecture. The fix is already partially applied (`newArchEnabled: true` in `app.json`). The remaining action is to ensure `react-native-worklets` is installed and the EAS build uses a stable image.

**Changes:**
- `app.json`: `newArchEnabled: true` (already done)
- `eas.json`: image remains `macos-sequoia-15.6-xcode-26.1`
- Verify `react-native-worklets` is in `package.json` dependencies after `npx expo install react-native-worklets`
- New EAS build required after all other fixes are complete

---

### BUG-02 — Invisible Text in Input Fields

**File:** `src/core/navigation/RootNavigator.tsx`

The `nicknameInput` TextInput style does not specify a `color` property. On web (Safari) and iOS dark mode, the browser/OS applies a default text color that matches the dark background.

**Change:** Add `color: colors.text` (or `color: '#FFFFFF'`) to the `nicknameInput` style and any other TextInput in the file that lacks an explicit `color`.

```tsx
nicknameInput: {
  flex: 1,
  borderWidth: 1.5,
  borderColor: colors.primary,
  borderRadius: radius.md,
  paddingHorizontal: spacing.sm,
  paddingVertical: 8,
  color: colors.text,          // ← ADD THIS
  maxLength: 30,
},
```

Also apply to any TextInput in `UserAlbumsModal.tsx` used for album rename.

---

### BUG-03 — Save Button Off-Screen and Non-Functional

**File:** `src/core/navigation/RootNavigator.tsx`

The profile modal's edit row (`editRow`) is inside a `ScrollView` or a container without `KeyboardAvoidingView`, causing the save button to be pushed below the keyboard on smaller screens.

**Changes:**
1. Wrap the modal content with `KeyboardAvoidingView` (behavior `padding` on iOS, `height` on Android).
2. Ensure `editRow` uses `flexShrink: 1` so it does not overflow.
3. Verify `handleSaveNickname` is correctly bound to the button's `onPress`. If the button is inside a nested `TouchableOpacity` that intercepts touches, flatten the hierarchy.

---

### BUG-04 — Album Delete Does Not Work

**File:** `src/modules/auth/components/UserAlbumsModal.tsx`

The `handleDelete` function calls `confirm()`, which is an async confirmation helper. The issue is likely that `confirm()` is not awaited or the callback is not executed on the UI thread.

**Change:** Add `try/catch` error handling inside the confirmation callback and log failures. Verify `confirm()` resolves the callback correctly. If `confirm()` uses `Alert.alert` internally, ensure it is not swallowed by the web polyfill on Safari.

```tsx
const handleDelete = (album: UserAlbum) => {
  if (userAlbums.length === 1) {
    Alert.alert('Atenção', 'Você precisa ter pelo menos uma coleção.');
    return;
  }
  Alert.alert(
    'Excluir coleção',
    `Excluir "${album.name}"? Todos os dados serão perdidos.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await userAlbumService.remove(album.id);
            const remaining = userAlbums.filter(a => a.id !== album.id);
            setUserAlbums(remaining);
            const newAll = { ...allCollections };
            delete newAll[album.id];
            setAllCollections(newAll);
            if (activeUserAlbumId === album.id) {
              const next = remaining[0];
              const col = await cloudCollectionService.load(next.id);
              setActiveUserAlbum(next.id);
              await applyCollection(col);
            }
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir a coleção.');
          } finally {
            setLoading(false);
          }
        },
      },
    ],
  );
};
```

---

### BUG-05 — Album Name Not Pre-filled on Edit

**File:** `src/modules/auth/components/UserAlbumsModal.tsx`

When the edit icon is tapped, `setEditingName(album.name)` is called (line 148). The `TextInput` value is bound to `editingName`. The pre-fill should work — the likely issue is that `editingName` is being cleared somewhere after being set, or the `TextInput` `value` prop is bound to `editingName` but is also controlled by a stale closure.

**Change:** Ensure the TextInput for album rename uses `value={editingId === album.id ? editingName : ''}` and that `setEditingName(album.name)` is called synchronously before `setEditingId(album.id)`.

---

### BUG-06 — Album Selector Overlapped by Profile Button

**Files:** `src/core/navigation/RootNavigator.tsx`, `src/modules/dashboard/screens/HomeScreen.tsx`

The profile button is absolutely positioned at `top: 52, right: spacing.md, zIndex: 100`. The album chip in the header is positioned in the same horizontal region.

**Changes:**
1. In `RootNavigator.tsx`: Move the profile button `top` value to `top: 100` or adjust `right` to avoid the chip area. Alternatively, reduce the `zIndex` to `10` and ensure the chip has `zIndex: 20`.
2. In `HomeScreen.tsx`: Add `paddingRight: 56` (profile button width + margin) to the `headerRight` container so the chip never renders behind the button.

---

### BUG-07 — Cross-Album Duplicate Signaling

**Files:** `src/modules/album/store/stickerStore.ts`, `src/modules/album/components/StickerCard.tsx` (or the screen rendering sticker cards)

#### Core Interface — stickerStore.ts

Add a selector that returns the IDs of albums where a given sticker is marked `duplicate`:

```ts
// Add to stickerStore.ts actions/selectors
getCrossAlbumDuplicateSources: (figurinhaId: string): string[] => {
  const { allCollections, activeUserAlbumId } = get();
  return Object.entries(allCollections)
    .filter(([albumId, col]) =>
      albumId !== activeUserAlbumId &&
      col[figurinhaId] === 'duplicate'
    )
    .map(([albumId]) => albumId);
},
```

#### StickerCard Highlight

In the sticker card component, call `getCrossAlbumDuplicateSources(figurinhaId)`. If the result is non-empty AND the sticker's status in the active album is `missing`, apply a red highlight border (e.g., `borderColor: '#E74C3C'`, `borderWidth: 2`).

#### Tap Interaction

When the user taps a cross-album-highlighted sticker:
1. Set the sticker status to `owned` in the active album (existing `toggleSticker` or `setStatus`).
2. After the status update, call `Alert.alert` asking: *"Esta figurinha está repetida em [Album A Name]. Deseja marcá-la como 'tenho' lá também?"*
3. If confirmed: call `setStatus(figurinhaId, 'owned', sourceAlbumId)` for each source album.

---

### BUG-08 — "Foil" Label Must Display as "Brilhante"

**Files:** All files that render sticker type labels to the user.

The `displayType()` function in `userSettingsStore.ts` already maps `'Foil Player' → 'Brilhante'`. The fix is to audit every place where a type string is rendered and ensure `displayType()` is called.

**Audit targets:**
- `TypeSettingsModal.tsx` — already uses `displayType()` ✅
- `CromoCard.tsx` / `StickerCard.tsx` — if type badge is added (BUG-07), use `displayType()`
- Any filter/search screen that shows type labels
- Any badge or tag component rendering raw type strings

**Change:** Replace every raw type string rendered in the UI with `displayType(type)`.

---

### BUG-09 — Mandatory Types Always Visible and Locked

**File:** `src/modules/auth/components/TypeSettingsModal.tsx`

Currently, `FIXED_TYPES` are excluded from the rendered list. Add a locked section at the top of the modal.

**Change:** Before rendering `configurableTypes`, render `FIXED_TYPES` as a separate locked row:

```tsx
// Locked types section (top of list)
{FIXED_TYPES.map(type => (
  <View key={type} style={styles.typeRow}>
    <View style={[styles.checkbox, styles.checkboxChecked, styles.checkboxLocked]}>
      <Text style={styles.checkmark}>✓</Text>
    </View>
    <Text style={styles.typeLabel}>{displayType(type)}</Text>
    <Text style={styles.lockIcon}>🔒</Text>
  </View>
))}
// Divider
// Configurable types section (existing render)
```

Add `checkboxLocked` style: `{ opacity: 0.6 }` to communicate non-interactivity.

---

### BUG-10 — Checkboxes Without Label and Border

**File:** `src/modules/auth/components/TypeSettingsModal.tsx`

The checkbox rows for configurable types are missing visible labels and borders. This is a styling issue.

**Changes:**
1. Ensure each `configurableType` row renders `<Text>{displayType(type)}</Text>` next to the checkbox.
2. Add `borderWidth: 1.5`, `borderColor: colors.border` to the unchecked checkbox style.
3. Verify the `typeRow` container uses `flexDirection: 'row'` and `alignItems: 'center'` so label and checkbox are on the same line.

---

## Data Models

No changes to Supabase schema or AsyncStorage keys.

The cross-album detection (BUG-07) uses the existing `allCollections: Record<string, UserCollection>` structure already in `stickerStore.ts`. No new fields required.

---

## Development Sequencing

### Build Order

1. **BUG-08** — Apply `displayType()` everywhere (no dependencies; pure label fix).
2. **BUG-10** — Fix checkbox label + border in `TypeSettingsModal.tsx` (depends on: none; isolated style fix).
3. **BUG-09** — Add locked FIXED_TYPES section to `TypeSettingsModal.tsx` (depends on: step 2 — same file, do after styling is correct).
4. **BUG-02** — Add `color` to TextInput styles in `RootNavigator.tsx` and `UserAlbumsModal.tsx` (depends on: none).
5. **BUG-05** — Fix album name pre-fill in `UserAlbumsModal.tsx` (depends on: step 4 — same file).
6. **BUG-04** — Replace `confirm()` with explicit `Alert.alert` in `UserAlbumsModal.tsx` (depends on: step 5 — same file).
7. **BUG-03** — Fix save button position with `KeyboardAvoidingView` in `RootNavigator.tsx` (depends on: step 4 — same file).
8. **BUG-06** — Fix profile button / album selector overlap in `RootNavigator.tsx` + `HomeScreen.tsx` (depends on: step 7 — same file).
9. **BUG-07** — Add `getCrossAlbumDuplicateSources` selector to `stickerStore.ts`; update `StickerCard` highlight and tap logic (depends on: step 1 — `displayType()` must be available for type labels).
10. **BUG-01** — Verify `newArchEnabled: true`, `react-native-worklets` installed, then trigger new EAS build (depends on: steps 1–9 — all fixes must be complete before the build).

---

## Testing Strategy

All bugs were identified on web (Safari). Local validation must happen on web before triggering an EAS build.

| Bug | Local Test |
|-----|-----------|
| BUG-02 | Edit name field → text must be visible |
| BUG-03 | Edit name → save button visible above keyboard |
| BUG-04 | Delete album with 2+ albums → album removed from list |
| BUG-05 | Tap edit on album → name field pre-filled |
| BUG-06 | Home screen → chip and profile button do not overlap |
| BUG-07 | Mark sticker duplicate in Album A → appears red in Album B → tap → Alert shown → confirm → Album A updates |
| BUG-08 | All "Foil" labels replaced by "Brilhante" |
| BUG-09 | Player, Brilhante, Silver appear locked at top of type modal |
| BUG-10 | All checkboxes show label and border |
| BUG-01 | New EAS build opens correctly on iPhone via TestFlight |

---

## Architecture Decision Records

- [ADR-001: Bug Fix Delivery Strategy — Big Bang](adrs/adr-001.md) — All 10 bugs corrected in a single cycle; one EAS build submitted to TestFlight.
- [ADR-002: Cross-Album Duplicate Detection — Store Selector](adrs/adr-002.md) — `getCrossAlbumDuplicateSources` added to `stickerStore.ts`; no new files.
- [ADR-003: Cross-Album Confirmation Dialog — Alert.alert](adrs/adr-003.md) — Use native `Alert.alert` for the cross-album update confirmation.
- [ADR-004: FIXED_TYPES Visibility in TypeSettingsModal](adrs/adr-004.md) — Render locked types at top of modal with disabled checkbox and lock icon.
