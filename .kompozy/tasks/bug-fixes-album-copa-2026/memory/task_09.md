# Task Memory: task_09.md

## Objective Snapshot
Implement cross-album duplicate signaling: red highlight on sticker cards when the sticker is 'missing' in active album but 'duplicate' in another album, plus Alert confirmation flow when tapped.

## Important Decisions
- Used `setStatus(figurinhaId, 'owned', sourceAlbumId)` (modified existing `setStatus` with optional `targetAlbumId`) instead of creating a new action, keeping changes minimal
- Wrapped `CromoCard` in a `View` with red border rather than modifying `CromoCard` to accept a `style` prop
- Used `userAlbums` from `stickerStore` (not `authStore`) to resolve album names since that's where it lives
- Used `jest.spyOn(Alert, 'alert')` with button callback capture for integration tests (matching pattern from shared workflow memory)

## Learnings
- `setStatus` now supports `targetAlbumId?: string` — when set to a different album, updates `allCollections[targetAlbumId]` and persists to cloud only (not local storage)
- `getCrossAlbumDuplicateSources` is a pure selector with no side effects — filters `allCollections` excluding active album
- When testing components wrapping CromoCard, use `UNSAFE_getByType(TouchableOpacity)` to fire press events on the inner touchable
- Alert button callbacks are captured via `jest.spyOn(Alert, 'alert')` — access `mock.calls[i][2]` for the buttons array

## Files / Surfaces
- `src/modules/album/store/stickerStore.ts` — added `getCrossAlbumDuplicateSources` selector (line 213), modified `setStatus` to accept `targetAlbumId` (line 135)
- `src/modules/album/components/StickerCard.tsx` — full rewrite with highlight logic, Alert confirmation, and custom tap handler
- `src/tests/unit/stickerStore.test.ts` — added 5 tests for `getCrossAlbumDuplicateSources`, 6 tests for `setStatus` with `targetAlbumId`
- `src/tests/unit/StickerCard.test.tsx` — new file with 4 highlight render tests + 5 tap/Alert integration tests

## Errors / Corrections
None

## Ready for Next Run
Yes
