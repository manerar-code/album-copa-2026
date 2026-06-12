# TechSpec: Bug Fixes Batch 2 — Álbum Copa 2026

**Version:** 1.0
**Date:** 2026-06-03
**Status:** Draft
**PRD Reference:** `_prd.md`

---

## Executive Summary

This TechSpec describes targeted code changes to resolve 12 UI bugs across four categories: sticker visual states, type labels, layout overlaps, and onboarding layout. Every fix is a surgical edit to an existing file — no new packages, no new directories, no schema changes. The primary trade-off is that all changes ship together in one build (ADR-001), requiring full web regression before triggering EAS. The most impactful change is BUG-12 (CromoCard owned state), which removes `LinearGradient` from the owned branch and replaces it with a plain `View` with a green border — resolving the color confusion between owned and duplicate states.

---

## System Architecture

No architectural changes. All fixes are in-place edits to existing files:

```
src/
├── shared/
│   ├── components/CromoCard.tsx          → BUG-12 (owned border + check icon)
│   └── store/userSettingsStore.ts        → BUG-02 (TYPE_DISPLAY additions)
├── core/navigation/RootNavigator.tsx     → BUG-08 (Faltantes tab icon)
├── modules/
│   ├── auth/components/
│   │   ├── TypeSettingsModal.tsx         → BUG-05, BUG-11
│   │   └── UserAlbumsModal.tsx           → BUG-01
│   ├── album/screens/AlbumListScreen.tsx → BUG-07
│   └── onboarding/components/
│       └── OnboardingModal.tsx           → BUG-03, BUG-04, BUG-09, BUG-10
└── shared/components/ScreenHeader.tsx    → BUG-06
```

---

## Component Design

### Category 1 — Sticker Visual States

#### BUG-12 — CromoCard Owned State

**File:** `src/shared/components/CromoCard.tsx`

The `cardContent` branch currently applies `LinearGradient` (gold) to all non-missing states. Split into three explicit branches: `missing`, `owned`, `duplicate`.

**Core Interface:**

```tsx
// Replace the existing isMissing ? (...) : (...) branch with:
const cardContent = isMissing ? (
  <View style={[s.outerMissing, { width, height: h, borderRadius: radius.cromo }]}>
    {inner}
  </View>
) : isDup ? (
  <LinearGradient
    colors={gradients.cromoGold.colors}
    start={gradients.cromoGold.start}
    end={gradients.cromoGold.end}
    style={[s.outerDup, { width, height: h, borderRadius: radius.cromo }]}
  >
    {inner}
    {dupCount > 1 && (
      <LinearGradient colors={[colors.goldSoft, colors.gold]} style={s.dupBadge}>
        <Text style={s.dupBadgeText}>×{dupCount}</Text>
      </LinearGradient>
    )}
  </LinearGradient>
) : (
  // owned — plain View, green border, no check icon
  <View style={[s.outerOwned, { width, height: h, borderRadius: radius.cromo }]}>
    {inner}
  </View>
);
```

**Style changes:**
- `outerOwned`: remove padding wrapper; add `borderWidth: 2.5`, `borderColor: colors.owned?.border ?? '#2BD17E'`
- Remove the check icon render block (`state === 'owned'` icon overlay) from `inner` or card content
- Rename existing `outerOwned` to `outerDup` for the duplicate gradient wrapper

---

### Category 2 — Type Labels and Type List

#### BUG-02 — TYPE_DISPLAY Additions

**File:** `src/shared/store/userSettingsStore.ts`

Add missing entries to `TYPE_DISPLAY` so `displayType()` returns correct labels for all types found in the catalog:

```ts
export const TYPE_DISPLAY: Record<string, string> = {
  'Foil Player': 'Brilhante',
  'Silver': 'Silver',        // explicit — capitalizes if DB sends lowercase
  'Player': 'Player',        // explicit — ensures consistency
  'foil': 'Brilhante',       // guard for lowercase variant from DB
  'silver': 'Silver',        // guard for lowercase variant from DB
  'player': 'Player',        // guard for lowercase variant from DB
};
```

`displayType()` already uses `TYPE_DISPLAY[type] ?? type` — no function change needed.

---

#### BUG-05 & BUG-11 — TypeSettingsModal Labels and Deduplication

**File:** `src/modules/auth/components/TypeSettingsModal.tsx`

**BUG-05 (missing labels):** Labels are already rendered via `displayType(type)` in the existing code. The root cause is that `displayType()` returns the raw type string for unmapped types (e.g., `'Silver'`). Fix: resolved by BUG-02 TYPE_DISPLAY additions above.

**BUG-11 (duplicates + pre-marking):**

1. `configurableTypes` already excludes `FIXED_TYPES` via `!FIXED_TYPES.includes(f.type)`. The duplicate likely occurs because the DB contains both `'Foil Player'` and `'foil'` (different case). Fix: normalize type comparison to lowercase in the filter:

```ts
const configurableTypes = useMemo(() => {
  const fixedLower = FIXED_TYPES.map(t => t.toLowerCase());
  const set = new Set<string>();
  for (const f of figurinhas) {
    if (f.type && !fixedLower.includes(f.type.toLowerCase())) set.add(f.type);
  }
  return Array.from(set).sort();
}, [figurinhas]);
```

2. Pre-marking: `FIXED_TYPES` are force-merged in `setTrackedTypes`. The issue is `loadSettings` may not include FIXED_TYPES if AsyncStorage is empty. Fix: in `loadSettings`, always merge FIXED_TYPES into the initial value:

```ts
// In userSettingsStore loadSettings:
const merged = Array.from(new Set([...(loaded ?? allTypes), ...FIXED_TYPES]));
set({ trackedTypes: merged });
```

---

### Category 3 — Layout and Overlap

#### BUG-01 — Album Name Fallback

**File:** `src/modules/auth/components/UserAlbumsModal.tsx`

Add a null/empty fallback when rendering `album.name`:

```tsx
<Text style={styles.albumName}>
  {album.name?.trim() || 'Coleção sem nome'}
</Text>
```

---

#### BUG-06 — Album Selector Chip Overlap

**File:** `src/shared/components/ScreenHeader.tsx`

The `albumChip` has `maxWidth: 180`. On `AlbumListScreen`, the floating profile button (`top: 52, right: spacing.md, zIndex: 100` in `RootNavigator`) overlaps it. Fix: reduce `maxWidth` to `140` and add `marginRight: 48` to the chip container row so it never renders under the button.

If the fix is also needed in `HomeScreen.tsx` header, apply the same `paddingRight` adjustment there.

---

#### BUG-07 — Selection Name Truncation

**File:** `src/modules/album/screens/AlbumListScreen.tsx`

The duplicate badge has no fixed width, compressing the name. Fix: add `maxWidth: 64` to the badge style and ensure the name `View` has `flex: 1`:

```tsx
// Name text — already has numberOfLines={1}, add ellipsizeMode
<Text style={s.name} numberOfLines={1} ellipsizeMode="tail">
  {item.nome}
</Text>
// Badge — add maxWidth
<Text style={[s.badge, { maxWidth: 64 }]}>{dupCount} rep</Text>
```

---

#### BUG-08 — Faltantes Tab Icon

**File:** `src/core/navigation/RootNavigator.tsx`

One-line change in the `tabIcons` map:

```ts
const tabIcons: Record<string, string> = {
  Home: '🏠',
  Album: '📖',
  Missing: '🔍',   // was ❌
  Duplicates: '🔄',
  Stats: '📊',
};
```

---

### Category 4 — Onboarding Screen Layout

**File:** `src/modules/onboarding/components/OnboardingModal.tsx`

All four onboarding bugs share the same root cause: the `topBar` has no bottom margin, causing it to visually overlap the slide title; and the content area has no bottom padding, causing footer elements to be clipped by the action button.

**StyleSheet changes:**

```ts
topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 22,
  paddingTop: 12,        // ADD — space from status bar
  paddingBottom: 12,     // ADD — was 0; separates from slide content
  marginBottom: 8,       // ADD — extra gap before title
},

content: {
  flex: 1,
  paddingHorizontal: 26,
  justifyContent: 'center',
  paddingBottom: 16,     // ADD — prevents content clipping by footer
},
```

These changes address:
- **BUG-03:** `paddingBottom: 12` + `marginBottom: 8` on `topBar` separates "Pular"/"Passo X de 3" from slide title
- **BUG-04:** `paddingBottom: 16` on `content` keeps cycle legend above action button
- **BUG-09:** Same as BUG-03 — `topBar` bottom spacing resolves title overlap
- **BUG-10:** Same as BUG-04 — content area bottom padding keeps legend visible

---

## Data Models

No changes to Supabase schema or AsyncStorage keys.

`TYPE_DISPLAY` additions in `userSettingsStore.ts` are pure in-memory mappings — no persistence change.

---

## Development Sequencing

### Build Order

1. **BUG-02** — Add entries to `TYPE_DISPLAY` in `userSettingsStore.ts` (no dependencies).
2. **BUG-08** — Change `Missing` tab icon in `RootNavigator.tsx` (no dependencies; one-line change).
3. **BUG-05 + BUG-11** — Fix `TypeSettingsModal.tsx` deduplication and pre-marking (depends on step 1 — TYPE_DISPLAY must be complete for label rendering to be correct).
4. **BUG-01** — Add album name fallback in `UserAlbumsModal.tsx` (no dependencies).
5. **BUG-07** — Fix selection name truncation in `AlbumListScreen.tsx` (no dependencies).
6. **BUG-06** — Fix album chip overlap in `ScreenHeader.tsx` and `HomeScreen.tsx` (no dependencies).
7. **BUG-12** — Refactor `CromoCard.tsx` owned/duplicate/missing branches; remove check icon; apply green border (no dependencies, but test alongside duplicate state after change).
8. **BUG-03 + BUG-04 + BUG-09 + BUG-10** — Adjust `OnboardingModal.tsx` StyleSheet paddings (no dependencies; all four bugs fixed by same style changes).

---

## Testing Strategy

All bugs were identified on web (Safari). Validate on web before EAS build.

| Bug | Local Test |
|-----|-----------|
| BUG-01 | Open UserAlbumsModal with an album that has no name → shows "Coleção sem nome" |
| BUG-02 | Album filter chips show "Brilhante" and "Silver" (not "foil"/"silver") |
| BUG-03 | Onboarding step 2 — "Pular" and "Passo 2 de 3" do not overlap card content |
| BUG-04 | Onboarding step 2 — full text visible above "Próximo" button |
| BUG-05 | TypeSettingsModal — every configurable type shows its label |
| BUG-06 | Album chip fully visible and tappable on AlbumListScreen header |
| BUG-07 | Selection with duplicate badge — name uses full available width with ellipsis |
| BUG-08 | Faltantes tab shows 🔍 icon |
| BUG-09 | Onboarding step 1 — "Pular" does not overlap "Como marcar figurinhas" title |
| BUG-10 | Onboarding step 1 — "Falta → Tenho → Repetida → Falta" fully visible above "Próximo" |
| BUG-11 | TypeSettingsModal — no duplicate type entries; Player/Brilhante/Silver pre-marked |
| BUG-12 | Owned sticker shows green border, no check icon; duplicate shows gold gradient |

---

## Architecture Decision Records

- [ADR-001: Bug Fix Delivery Strategy — Categorical with Single Build](adrs/adr-001.md) — 12 bugs in 4 categories, one EAS build.
- [ADR-002: Sticker "Tenho" State — Green Border, No Check Icon](adrs/adr-002.md) — Owned state uses green border only; check icon removed.
- [ADR-003: CromoCard Owned State — Plain View with Green Border](adrs/adr-003.md) — LinearGradient removed from owned branch; reserved for duplicate only.
- [ADR-004: Faltantes Tab Icon — 🔍](adrs/adr-004.md) — Replace ❌ with 🔍 in tabIcons map.
- [ADR-005: Onboarding Layout Fix — StyleSheet Padding Adjustment](adrs/adr-005.md) — Padding/margin changes only; no SafeAreaView refactor.
