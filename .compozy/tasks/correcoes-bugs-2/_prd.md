# PRD: Bug Fixes Batch 2 — Álbum Copa 2026

**Version:** 1.0
**Date:** 2026-06-03
**Status:** Draft
**Owner:** attriadigital

---

## Overview

This document defines the requirements for correcting 12 UI bugs identified during testing of the Álbum Copa 2026 web version (Safari) and onboarding flow. The bugs span four categories: sticker visual states, type label display, layout overlaps, and onboarding screen layout. All fixes are delivered in a single development cycle and one EAS build submitted to TestFlight.

---

## Goals

- Correct all 12 identified UI bugs before the next TestFlight release.
- Ensure sticker status colors match the established design system (green = owned, gold = duplicate).
- Ensure all type labels are displayed in their translated, correctly capitalized form.
- Ensure the onboarding flow renders without overlapping elements on all iPhone screen sizes.
- Ensure album and selection names are always readable in list views.

---

## User Stories

1. As a user viewing my sticker album, I want owned stickers to show a green border without a check icon, so I can identify my collection at a glance using consistent color coding.
2. As a user filtering by sticker type, I want to see "Brilhante" and "Silver" instead of "foil" and "silver", so the interface is in my language and properly formatted.
3. As a new user going through onboarding, I want to read the title and step indicator without them overlapping each other, so I understand where I am in the flow.
4. As a new user on the onboarding screen, I want all text to be fully visible without being cut off by buttons, so I can read the complete instructions.
5. As a user managing my albums, I want every album in the list to display its name, so I can identify and manage each collection.
6. As a user browsing the album, I want the album selector chip to be fully visible and tappable, so I can switch between collections.
7. As a user on the Faltantes tab, I want to see the correct icon in the navigation bar, so I can identify the tab without confusion.
8. As a user browsing selections, I want to read the full selection name even when a duplicate badge is present, so I know which team I am viewing.
9. As a user configuring type filters, I want to see each type listed once with its label visible, so I can understand and manage my preferences.
10. As a user opening the type settings modal, I want Foil, Silver, and Player to already be checked, so I do not need to manually enable the mandatory types.

---

## Core Features

### Category 1 — Sticker Visual States

**BUG-12 — Owned Sticker Border Color and Icon**
When a sticker is marked as "tenho" (owned), the card border must be green (matching the design system's owned color token). The gold/yellow gradient border must not be applied to the owned state. The check icon currently displayed in the top-left corner of owned sticker cards must be removed entirely. No replacement indicator is added — the green border alone communicates the owned state.

---

### Category 2 — Type Labels and Type List

**BUG-02 — Type Filter Chips Showing Raw Labels**
The type filter chips in the album screen must display translated and correctly capitalized labels for all types. "foil" must display as "Brilhante" and "silver" must display as "Silver". Any other type that appears in raw lowercase form must be capitalized. The `displayType()` function must cover all types present in the catalog, not only "Foil Player".

**BUG-05 — Checkboxes Without Labels in Type Settings Modal**
Every item in the "Ative tipos" modal must display a visible text label next to its checkbox. No item may appear as a checkbox only. The label must use the translated display name via `displayType()`.

**BUG-11 — Type List Shows Duplicates and Types Not Pre-marked**
The type settings modal must display each type exactly once. Types that appear in the fixed section (Player, Brilhante, Silver) must not appear again in the configurable section. Player, Brilhante (Foil), and Silver must arrive pre-marked when the modal opens, regardless of previous user interaction.

---

### Category 3 — Layout and Overlap

**BUG-01 — Second Album Without Name in List**
Every album in the collection list must display its name. An album row must never render with only edit and delete icons and no name text.

**BUG-06 — Album Selector Chip Overlapped by Profile Button**
The album selector chip in the album screen header must be fully visible and tappable. The floating profile avatar button must not obscure any part of the chip.

**BUG-07 — Selection Name Truncated by Duplicate Badge**
In the album selection list, the selection name must use all available horizontal space. The duplicate badge ("1 rep") must have a fixed maximum width so it does not compress the name. The name may use ellipsis truncation only when it genuinely exceeds available space after the badge is accounted for.

**BUG-08 — "Faltantes" Tab Shows X Red Icon**
The Faltantes tab in the bottom navigation bar must display the correct icon, not a red X emoji. The icon must be consistent with the visual style of the other tabs.

---

### Category 4 — Onboarding Screen Layout

**BUG-03 — "Pular" Button and Step Indicator Overlapping Content**
On all onboarding slides, the "Pular" (skip) button and the "Passo X de 3" step pill must be positioned in a dedicated top bar area that does not overlap the slide title or body content. The top bar must have sufficient vertical separation from the content below it.

**BUG-04 — Text Truncated Below "Próximo" Button**
No text content on any onboarding slide may be hidden or clipped below the "Próximo" or "Concluir" button. The slide content area must scroll or resize to ensure all text is visible above the action button.

**BUG-09 — "Pular" Button Overlapping Slide Title**
On the first onboarding slide ("Como marcar figurinhas"), the "Pular" button overlaps the slide title text. The layout must ensure the title renders below the top bar with no visual overlap.

**BUG-10 — Cycle Legend Clipped by "Próximo" Button**
The "Falta → Tenho → Repetida → Falta" cycle legend on the first onboarding slide must be fully visible. It must not be partially hidden behind or below the "Próximo" button.

---

## User Experience

- The green border for owned stickers must use the existing `owned` color token from the design system — no new colors introduced.
- The gold/yellow gradient border must be reserved exclusively for the "duplicate" (repetida) state.
- All type labels in filters, modals, and any other UI surface must use `displayType()` — no raw database strings visible to users.
- Onboarding layout fixes must use `SafeAreaView` or `useSafeAreaInsets` from `react-native-safe-area-context` to handle notch and home indicator areas correctly on all iPhone models.
- The "Faltantes" tab icon must match the visual style (emoji or icon set) used by the other tabs in the navigation bar.
- Selection names in the album list may use ellipsis truncation — they must never be completely invisible.

---

## Non-Goals

- No new features beyond the bug corrections described above.
- No changes to the data model or Supabase schema.
- No redesign of existing screens — targeted corrections only.
- No changes to the sticker status cycle (missing → owned → duplicate → missing).
- No changes to Android behavior unless the same fix resolves a cross-platform bug.

---

## Phased Rollout Plan

All 12 fixes are delivered in a single development cycle:

1. Fix Category 1 (sticker visual) and validate locally on web.
2. Fix Category 2 (type labels) and validate locally on web.
3. Fix Category 3 (layout/overlap) and validate locally on web.
4. Fix Category 4 (onboarding) and validate locally on web.
5. Run full regression on the web version (Safari).
6. Generate new iOS build via EAS.
7. Submit to TestFlight and validate on a physical iPhone.

---

## Success Metrics

- All 12 bugs are no longer reproducible on the web version (Safari).
- Owned sticker cards show green border and no check icon.
- All type filter chips and modal labels show translated names.
- Onboarding screens render without overlapping elements on iPhone SE and iPhone 15 Pro Max.
- Every album in the collection list displays its name.
- No new bugs introduced in screens touched by the fixes.
- New TestFlight build successfully submitted and approved by Apple.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Changing CromoCard border logic breaks duplicate state appearance | Test owned and duplicate states side by side after the fix. |
| TYPE_DISPLAY additions affect other screens using displayType() | Audit all displayType() call sites before and after the change. |
| Onboarding layout fix breaks on small screens (iPhone SE) | Test onboarding on 375px width viewport in web browser. |
| Album name missing may be a data issue (empty string in DB) | Add a fallback display name ("Sem nome") if album.name is empty or null. |

---

## Architecture Decision Records

- [ADR-001: Bug Fix Delivery Strategy — Categorical with Single Build](adrs/adr-001.md) — 12 bugs organized in 4 categories, delivered as one EAS build.
- [ADR-002: Sticker "Tenho" State — Green Border, No Check Icon](adrs/adr-002.md) — Owned state uses green border only; check icon removed entirely.

---

## Open Questions

- None. All ambiguities were resolved during brainstorming.
