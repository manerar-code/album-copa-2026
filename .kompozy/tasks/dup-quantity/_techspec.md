# TechSpec: Duplicate Sticker Quantity Tracking

## Executive Summary

This feature extends the existing sticker status system to track how many copies of each
duplicate sticker a collector holds. The core approach adds a parallel `quantities` slice to
`stickerStore` — a `Record<figurinhaId, number>` persisted under a new AsyncStorage key —
leaving `UserCollection`, `StickerStatus`, and all existing callers untouched.

The tap cycle changes in one place: when `toggleSticker` is called on a sticker already in
`duplicate` state, it increments the quantity instead of cycling to `missing`. A new
`resetSticker` action handles badge-tap resets. `CromoCard` gains an `onPressDupBadge` callback
prop. `DuplicatesScreen` replaces the hardcoded `dupCount={2}` with a live store lookup and
updates the share formatter to include `×N` suffixes.

**Primary trade-off:** two AsyncStorage writes per increment tap instead of one. This is
acceptable given the tiny payload size and the zero migration cost compared to embedding
quantity in `UserCollection`.

---

## System Architecture

### Component Overview

```
stickerStore (Zustand)
  ├── collection: Record<id, StickerStatus>   ← unchanged
  └── quantities: Record<id, number>          ← NEW

collectionService (AsyncStorage)
  ├── user_collection_<albumId>               ← unchanged
  └── user_quantities_<albumId>               ← NEW

CromoCard (shared component)
  ├── dupCount prop                           ← already exists
  └── onPressDupBadge prop                   ← NEW callback

DuplicatesScreen
  ├── reads quantities from store             ← replaces hardcoded dupCount={2}
  ├── total = sum of quantities               ← replaces count of unique stickers
  └── handleShare formats ×N suffix          ← updated
```

Data flow for an increment tap:
1. User taps a `duplicate` CromoCard → `onPress` fires → `toggleSticker(id)`
2. `toggleSticker` detects current status === `duplicate` → calls `incrementDupCount(id)`
3. `incrementDupCount` writes `quantities[id] + 1` to store and AsyncStorage
4. Zustand notifies subscribers → `DuplicatesScreen` re-renders card with updated `dupCount`

Data flow for a badge reset tap:
1. User taps `×N` badge on a `duplicate` CromoCard → `onPressDupBadge` fires → `resetSticker(id)`
2. `resetSticker` sets `collection[id] = 'missing'` and removes `quantities[id]`
3. Both AsyncStorage keys updated; card transitions to `missing` state

---

## Implementation Design

### Core Interfaces

**New store actions in `stickerStore.ts`:**

```typescript
// Added to StickerStoreState interface
quantities: Record<string, number>;
incrementDupCount: (figurinhaId: string) => void;
resetSticker: (figurinhaId: string) => void;
getDupCount: (figurinhaId: string) => number;
```

**Modified `toggleSticker` behaviour (conceptual diff):**

```typescript
// Before: STATUS_CYCLE[current] always advances
// After: when current === 'duplicate', increment instead of cycling
function toggleSticker(figurinhaId: string) {
  const current = collection[figurinhaId] ?? 'missing';
  if (current === 'duplicate') {
    incrementDupCount(figurinhaId);   // stays duplicate, count +1
    return;
  }
  const next = STATUS_CYCLE[current]; // missing→owned or owned→duplicate
  // ... existing persist+sync logic unchanged
}
```

**New `CromoCardProps` callback:**

```typescript
interface CromoCardProps {
  // ... existing props unchanged ...
  onPressDupBadge?: () => void;  // NEW: called when ×N badge is tapped
}
```

### Data Models

**`quantities` store slice:**

```
Record<figurinhaId: string, count: number>
```

- Key: `figurinha.id` (same as in `collection`)
- Value: integer ≥ 1. Entry absent ↔ quantity = 1 (default)
- Only `duplicate` stickers have meaningful quantity entries. When a sticker leaves `duplicate`
  state (via `resetSticker`), its entry is deleted from `quantities`.

**AsyncStorage — new key:**

```
Key:   "user_quantities_<activeUserAlbumId>"
Value: JSON object, e.g. { "fig-007": 2, "fig-010": 3 }
```

Existing key `"user_collection_<albumId>"` is not modified.

**`quantitiesService` (new file at `src/shared/services/quantitiesService.ts`):**

```typescript
const quantitiesKey = (albumId: string) => `user_quantities_${albumId}`;

export const quantitiesService = {
  save: (q: Record<string, number>, albumId: string) => { ... },
  load: (albumId: string): Promise<Record<string, number>> => { ... },
  reset: (albumId: string) => { ... },
};
```

Mirrors the shape of `collectionService` for consistency.

### API Endpoints

Not applicable — this feature is fully offline with no network calls.

---

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|----------------------|-----------------|
| `src/shared/types/index.ts` | unchanged | `StickerStatus` and `UserCollection` types not modified | None |
| `src/shared/services/quantitiesService.ts` | new | AsyncStorage CRUD for quantities | Create file |
| `src/modules/album/store/stickerStore.ts` | modified | Add `quantities` slice, `incrementDupCount`, `resetSticker`, `getDupCount`; modify `toggleSticker` branch | Modify |
| `src/shared/components/CromoCard.tsx` | modified | Add `onPressDupBadge?: () => void` prop; wire badge `TouchableOpacity` | Modify |
| `src/modules/duplicates/screens/DuplicatesScreen.tsx` | modified | Replace `dupCount={2}` with `getDupCount(f.id)`; update total calculation; update share formatter | Modify |
| `src/shared/services/collectionService.ts` | unchanged | Load path unchanged; no schema migration needed | None |
| `src/modules/album/screens/*` (album grid, team view) | modified | Pass `onPressDupBadge={() => resetSticker(f.id)}` to CromoCards in `duplicate` state | Modify |

---

## Testing Approach

### Unit Tests

**`src/tests/unit/stickerStore.test.ts`** — extend existing file:

- `toggleSticker` on a `duplicate` sticker increments `getDupCount` from 1 to 2
- `toggleSticker` called three times on the same sticker: status stays `duplicate`, count = 3
- `resetSticker` sets status to `missing` and removes the sticker from `quantities`
- `getDupCount` returns 1 for a sticker absent from `quantities`
- `getDupCount` returns 1 for a sticker with status `owned`
- Loading a collection with no quantities file defaults all counts to 1
- `incrementDupCount` persists to AsyncStorage (mock `quantitiesService.save`)

**`src/tests/unit/quantitiesService.test.ts`** — new file:

- `save` writes correct JSON to AsyncStorage under `user_quantities_<albumId>`
- `load` returns parsed object; returns `{}` when key absent
- `reset` removes the key

### Integration Tests

**`src/tests/integration/DuplicatesScreen.test.tsx`** — extend existing or create:

- Card with `collection[id] = 'duplicate'` and `quantities[id] = 3` renders `×3` badge
- Card with `collection[id] = 'duplicate'` and no quantities entry renders no badge (×1 = hidden)
- Pressing badge calls `resetSticker`; card transitions to `missing`
- WhatsApp share message includes `×3` suffix for sticker with `quantities[id] = 3`
- WhatsApp share message omits suffix for sticker with `quantities[id] = 1` (or absent)
- Total in share message equals sum of all quantities (not count of unique stickers)

---

## Development Sequencing

### Build Order

1. **`quantitiesService.ts`** — no dependencies. Create AsyncStorage CRUD module mirroring
   `collectionService`.

2. **`stickerStore.ts` — quantities slice** — depends on step 1. Add `quantities` state,
   `incrementDupCount`, `resetSticker`, `getDupCount`. Modify `toggleSticker` to branch on
   `duplicate` state. Load `quantities` alongside `collection` in `loadCollection`.

3. **`CromoCard.tsx` — `onPressDupBadge` prop** — depends on step 2 (needs `resetSticker`
   to exist). Add prop, wrap badge in `TouchableOpacity` when `onPressDupBadge` is provided.

4. **`DuplicatesScreen.tsx`** — depends on steps 2 and 3. Replace hardcoded `dupCount={2}`
   with `getDupCount(f.id)`. Update total count to sum quantities. Update `handleShare` to
   append `×N` when quantity > 1.

5. **Album grid / team screens** — depends on steps 2 and 3. Pass `onPressDupBadge` to
   CromoCards rendered in `duplicate` state.

6. **Tests** — depends on steps 1–5. Write/update unit and integration tests as described.

### Technical Dependencies

- No external dependencies — fully offline feature.
- `quantitiesService` must be loaded in the same Zustand `loadCollection` call as
  `collectionService` to prevent a flicker where quantities are undefined on first render.

---

## Monitoring and Observability

No new network calls or background processes. Existing AsyncStorage error handling (via
`handleError` utility in services) covers persistence failures. No additional logging needed
for MVP.

---

## Technical Considerations

### Key Decisions

**Separate quantities store (ADR-002):**
- Chosen: `Record<figurinhaId, number>` in its own AsyncStorage key
- Rationale: zero change to `StickerStatus` type, no migration of existing collections
- Trade-off: two AsyncStorage writes per increment; acceptable given payload size (~100 bytes)

**Modify `toggleSticker` branch instead of new action (from PRD UX):**
- Chosen: when current status is `duplicate`, `toggleSticker` calls `incrementDupCount`
- Rationale: callers (CromoCard `onPress`) remain unchanged — one handler covers the full cycle
- Trade-off: `toggleSticker` does two different things depending on state; document clearly

**Badge as separate touch target (ADR-001):**
- Chosen: `onPressDupBadge` prop on `CromoCard`; badge wrapped in `TouchableOpacity`
- Rationale: minimum 44 pt touch target; distinct from card body tap; no new gesture required

### Known Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Quantities load after collection → brief ×1 flash | Low | Load both in same async call in `loadCollection` |
| Badge touch area too small on narrow devices | Medium | Enforce `minWidth: 28, minHeight: 28` + negative margin padding |
| `toggleSticker` branch confusion in code review | Low | Add comment at branch point referencing ADR-002 |

---

## Architecture Decision Records

- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Tap advances quantity;
  badge tap resets to missing; no long-press or capped cycle.
- [ADR-002: Separate Quantities Store](adrs/adr-002.md) — Parallel `Record<id,number>` store
  over embedding quantity in `UserCollection` to avoid type breakage and migration risk.
