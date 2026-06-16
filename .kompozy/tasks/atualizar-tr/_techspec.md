# TechSpec: Trade Registration — Álbum Copa 2026

## Executive Summary

Trade Registration adds a "Registrar troca" button and modal to the Duplicates screen. The collector enters free-text sticker lists (sent and received), the app resolves them against the catalog, and then commits all mutations in a single atomic batch via a new `registerTrade` store action.

The primary trade-off is the new `registerTrade` batch action over looping existing single-item actions: batch processing requires one AsyncStorage write per mutation type instead of N, but introduces a new action surface in `stickerStore` that must maintain the existing save-first, sync-later contract. This approach is consistent with `resetCollection`, which similarly batches all sticker changes.

## System Architecture

### Component Overview

```
DuplicatesScreen
  └─ TradeRegistrationModal          (new — duplicates/components/)
       ├─ parseTradeList()           (existing — trades/utils/)
       ├─ resolveEntries()           (new — duplicates/utils/)
       └─ useStickerStore.registerTrade()  (new action — album/store/)
            ├─ collectionService.save()   (existing)
            ├─ quantitiesService.save()   (existing)
            └─ cloudCollectionService.upsertOne() × N via Promise.all  (existing)
```

Data flow:
1. User types in modal → `parseTradeList` extracts `ParsedEntry[]` → `resolveEntries` maps to `figurinhaId[]`
2. User confirms → `registerTrade(sentIds, receivedIds)` mutates store state in memory
3. `collectionService.save` + `quantitiesService.save` persist to AsyncStorage atomically
4. Cloud sync runs in background via `Promise.all(upsertOne × N)`, non-reverting on failure

## Implementation Design

### Core Interfaces

```typescript
// New store action (stickerStore.ts)
registerTrade: (sent: string[], received: string[]) => Promise<void>;

// New utility (src/modules/duplicates/utils/resolveEntries.ts)
export function resolveEntries(
  entries: ParsedEntry[],
  figurinhas: Figurinha[],
  selecoes: Selecao[],
): string[];

// Modal props (TradeRegistrationModal.tsx)
interface TradeRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
}
```

### Data Models

No new persistent types. The feature reuses:
- `UserCollection` — `Record<string, StickerStatus>` (existing)
- `Record<string, number>` for quantities (existing)
- `ParsedEntry` — `{ codigoFifa: string; numero: string }` from `parseTradeList`

### registerTrade Logic

**Sent sticker rules** (applied to each `figurinhaId` in `sent[]`):

| Current state | Current qty | Result |
|---------------|-------------|--------|
| `duplicate` | ≥ 2 | qty decremented by 1; status stays `duplicate` |
| `duplicate` | 1 (default) | status → `owned`; qty entry removed |
| `owned` or `missing` | any | skipped silently |

**Received sticker rules** (applied to each `figurinhaId` in `received[]`):

| Current state | Result |
|---------------|--------|
| `missing` | status → `owned` |
| `duplicate` | status → `owned`; qty entry removed |
| `owned` | no-op (idempotent) |

### resolveEntries Logic

```
for each ParsedEntry { codigoFifa, numero }:
  find selecao where selecao.codigo_fifa matches codigoFifa (case-insensitive)
  find figurinha where figurinha.selecao_id === selecao.id
    AND parseInt(figurinha.numero) === parseInt(entry.numero)
  if found: add figurinha.id to result
  else: skip silently
```

Pre-building lookup maps (O(1) per entry):
- `Map<string, string>` — `codigoFifa.toUpperCase()` → `selecaoId`
- `Map<string, string>` — `"${selecaoId}:${parseInt(numero)}"` → `figurinhaId`

## Integration Points

No new external services. The feature integrates with:
- `cloudCollectionService.upsertOne` (existing Supabase service) — called N times via `Promise.all` for changed stickers
- Offline queue: if `syncStore.status === 'offline'`, cloud sync is skipped (same pattern as `toggleSticker`); data persists in AsyncStorage until next online sync

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `stickerStore.ts` | modified | New `registerTrade` action added to store interface and implementation | Add action + update `CatalogState` interface |
| `DuplicatesScreen.tsx` | modified | Add modal visibility state + "Registrar troca" button + modal render | Low risk — additive only |
| `TradeRegistrationModal.tsx` | new | Modal component in `duplicates/components/` | Create new file |
| `resolveEntries.ts` | new | Pure utility in `duplicates/utils/` | Create new file |
| `parseTradeList.ts` | unmodified | Reused as-is from `trades/utils/` | No change |
| `collectionService.ts` | unmodified | Called via existing `save()` API | No change |
| `quantitiesService.ts` | unmodified | Called via existing `save()` API | No change |

## Testing Approach

### Unit Tests

**File:** `src/tests/unit/resolveEntries.test.ts`

- `resolveEntries` with valid entries returns correct figurinha IDs
- Unknown `codigoFifa` → skipped, no throw
- Unknown `numero` → skipped, no throw
- Leading-zero numbers resolve correctly (`"01"` and `"1"` both resolve to same sticker)
- Empty entries array → returns `[]`

**File:** `src/tests/unit/registerTradeLogic.test.ts`

- Sent sticker with qty = 3 → qty becomes 2, status stays `duplicate`
- Sent sticker with qty = 1 (default) → status becomes `owned`, qty entry removed
- Sent sticker with status `owned` → skipped, collection unchanged
- Received sticker with status `missing` → status becomes `owned`
- Received sticker with status `duplicate` → status becomes `owned`, qty removed
- Received sticker already `owned` → no-op
- Both sent and received lists empty → no mutations

### Integration Tests

**File:** `src/tests/integration/registerTrade.test.ts`

- `registerTrade(['fig-001'], ['fig-002'])` with mocked `collectionService` and `quantitiesService`
  - Verifies store state after call
  - Verifies `collectionService.save` called once (not N times)
  - Verifies `quantitiesService.save` called once
- Local save failure → store reverts to pre-trade state

## Development Sequencing

### Build Order

1. **`resolveEntries.ts`** — pure function, no dependencies
2. **`registerTrade` action in `stickerStore.ts`** — depends on existing services; takes resolved IDs directly (no dep on step 1)
3. **`TradeRegistrationModal.tsx`** — depends on steps 1 and 2; uses `parseTradeList` (already exists)
4. **`DuplicatesScreen.tsx` update** — depends on step 3; additive changes only

### Technical Dependencies

- No new packages required
- `parseTradeList` is already exported from `src/modules/trades/utils/parseTradeList.ts` — importable cross-module

## Monitoring and Observability

Log events using the existing `logger` utility:

```
registerTrade: local save failed — reverting   (logger.error)
registerTrade: cloud sync failed (will retry)  (logger.warn)
registerTrade: completed — X sent, Y received  (logger.log)
```

## Technical Considerations

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| User lists a sent sticker that has `qty=1` but badge is hidden — user may not see it's still duplicate | Low | resolveEntries still resolves it; store converts it to `owned` correctly regardless of badge visibility |
| `parseInt(figurinha.numero)` mismatch for special stickers (non-numeric codes like `CC-LAM4`) | Medium | resolveEntries skips unresolvable entries silently; same behavior as Trades screen |
| Partial cloud sync failure (some upserts succeed, some fail) | Low | Cloud failures are non-reverting; AsyncStorage is the source of truth; on next app open the sync catches up |

## Architecture Decision Records

- [ADR-001: Modal Único com Dois Campos](adrs/adr-001.md) — Modal único na tela de Repetidas com campos "Enviei" e "Recebi" (decisão de produto)
- [ADR-002: registerTrade Batch Action in stickerStore](adrs/adr-002.md) — Batch action única com uma gravação no AsyncStorage, vs loop de setStatus por sticker
- [ADR-003: TradeRegistrationModal co-located in duplicates/components](adrs/adr-003.md) — Modal vive no módulo duplicates (co-localização) vs shared/components ou trades/components
