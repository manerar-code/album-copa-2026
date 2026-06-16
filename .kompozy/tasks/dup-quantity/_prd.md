# PRD: Duplicate Sticker Quantity Tracking

## Overview

Collectors often have more than one copy of the same sticker and currently have no way to
record that count inside the app. Every duplicate is treated as a single unit regardless of how
many physical copies the collector holds. This feature lets collectors record the exact quantity
of each duplicate sticker using the same tap interaction they already know, so their trade lists
reflect reality and reduce back-and-forth negotiation with friends.

**Who it is for:** Any collector using Álbum Copa 2026 who accumulates multiple copies of the
same sticker and shares trade lists via WhatsApp.

**Why it is valuable:** Accurate duplicate counts eliminate the "I already traded that one"
problem. A collector who shares a list showing `BRA7 ×3` signals they can offer three copies,
making matching faster and reducing wasted conversations.

## Goals

- Collectors can record quantities of 1–N duplicates per sticker without leaving the screen
  they are already on.
- The WhatsApp share output includes per-sticker quantities so trade partners have complete
  information.
- Zero additional gestures required to mark a first duplicate (quantity defaults to 1, as today).
- All existing stickers already marked as `duplicate` retain their data and display as ×1
  automatically.

## User Stories

**Primary — the active trader:**
- As a collector, I want each tap on a duplicate card to increase its count by one, so I can
  quickly record that I have three copies of BRA7 with three taps.
- As a collector, I want to see the quantity displayed on each duplicate card, so I always
  know how many copies I have without opening another screen.
- As a collector, I want my WhatsApp trade list to show `BRA7 ×3` instead of just `BRA7`, so
  my friends know exactly how many I can offer.

**Secondary — the occasional swapper:**
- As a collector, I want a duplicate I marked by mistake to be easy to reset, so I do not have
  to tap through a long cycle to undo.
- As a collector, I want cards with only one duplicate to look the same as today (no visible
  counter clutter), so the screen stays clean when counts are low.

## Core Features

### 1. Tap-to-increment duplicate quantity

When a sticker is already in `duplicate` state, each tap increments its quantity by one
(×1 → ×2 → ×3 …). There is no upper bound. The first time a sticker enters `duplicate` state,
its quantity is 1. Quantity persists across app restarts, exactly like status today.

### 2. Quantity badge on duplicate cards

Each duplicate card displays a quantity badge (e.g., `×2`) when the quantity is greater than
one. At quantity = 1, no badge is shown to keep the card visually identical to the current
design. The badge is a distinct touch target that resets the sticker to `missing` when tapped.

### 3. Quantity in WhatsApp share (Duplicates screen)

The share message from the Duplicates screen includes per-sticker quantity when greater than 1:

```
🔄 Minhas figurinhas repetidas — Álbum Copa 2026

🇧🇷 Brasil
  BRA7 ×2 · Vinícius Jr
  BRA10 ×3 · Rodrygo
  BRA12 · Endrick

Total: 47 repetidas em 13 seleções
Enviado pelo Álbum Copa 2026 📱
```

Stickers with quantity = 1 show no suffix (no `×1` clutter). "Total" counts individual sticker
copies, not unique sticker IDs (so 3 copies of BRA10 counts as 3 toward the total).

### 4. Backward compatibility

All stickers currently marked `duplicate` are treated as quantity = 1 automatically. No data
migration prompt is shown to the user.

## User Experience

**Primary flow — recording duplicates:**

1. Collector opens any screen showing their stickers (album grid, team view).
2. Taps a sticker once: `missing → owned`.
3. Taps again: `owned → duplicate ×1`. Badge is not shown at ×1.
4. Taps again: `duplicate ×1 → duplicate ×2`. Badge `×2` appears on the card.
5. Each subsequent tap increments the badge number.

**Reset flow:**

1. Collector taps the `×N` badge on any duplicate card.
2. Sticker returns to `missing` immediately.
3. No confirmation dialog — the action is reversible by tapping the card again.

**Sharing flow:**

1. Collector opens the Duplicates screen and taps "📲 Enviar repetidas no WhatsApp".
2. Share sheet opens with the formatted message. Cards with quantity > 1 show `×N` inline.

**Discoverability:**

The badge appears naturally the moment a second duplicate is registered. No tutorial or tooltip
is required; the interaction follows directly from the existing tap-to-cycle pattern.

## High-Level Technical Constraints

- Quantity data must persist locally (offline-first) with the same reliability as sticker
  status today.
- All screens that display duplicate cards must reflect the quantity consistently without
  requiring a refresh.
- The Duplicates screen summary count must reflect total copies (sum of all quantities), not
  unique sticker IDs.
- Existing collections stored on-device must continue to work after the update; no data loss
  on upgrade.

## Non-Goals (Out of Scope)

- Tracking quantity for `owned` stickers (non-duplicate copies). Only `duplicate` state gets a
  counter.
- Cloud sync of quantity data — out of scope for this feature (sync is a separate initiative).
- Per-sticker quantity editing via a numeric input or picker.
- Quantity display on the Trade comparison screen (Trocas) — trade matching remains binary.
- Undo/redo history for quantity changes.

## Phased Rollout Plan

### MVP (Phase 1)

- Tap-to-increment cycle on all duplicate cards.
- Quantity badge `×N` visible when N > 1; badge tap resets to missing.
- Quantity persists locally across restarts.
- Existing `duplicate` stickers auto-assigned quantity = 1.
- **Success criteria:** Collectors can record and view quantities ≥ 1 without errors.

### Phase 2

- WhatsApp share message includes per-sticker `×N` when N > 1.
- Duplicates screen total count reflects sum of all quantities.
- **Success criteria:** Share output matches the app's displayed counts exactly.

### Phase 3 (future, not committed)

- Cloud sync of quantity data alongside status.
- Export quantity data in CSV format for power collectors.

## Success Metrics

- Zero reported cases of quantity data lost on app restart or upgrade.
- WhatsApp share messages include correct quantities for ≥ 95% of shared lists (verified by
  manual QA on release build).
- Duplicates screen total count equals the arithmetic sum of all individual sticker quantities.
- No regression in sticker status toggle performance (tap response < 100 ms).

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Accidental badge tap resets a high count | Tap resets to `missing`, which is immediately visible. User re-taps to rebuild count. No silent data loss. |
| Badge touch target too small on compact devices | Enforce minimum 44×44 pt touch area. |
| Existing `duplicate` stickers display unexpected badge after upgrade | Auto-assign quantity = 1 on first load; ×1 shows no badge — visually unchanged. |
| Total count in header misleads users | Document clearly in UI copy: "X figurinhas" = X copies total, not X unique stickers. |

## Architecture Decision Records

- [ADR-001: Tap-to-Increment + Badge-Tap-to-Reset](adrs/adr-001.md) — Chose tap-based increment
  with badge-tap reset over capped cycle or long-press picker, preserving single-gesture
  consistency while allowing unlimited counts.

## Open Questions

- Should the Duplicates screen section header show the sum of copies or the count of unique
  stickers? (Currently assumed: sum of copies, to match the updated total in the header.)
- Should `×1` ever be shown explicitly? Current decision: no, to avoid clutter. Revisit if
  user testing shows confusion.
