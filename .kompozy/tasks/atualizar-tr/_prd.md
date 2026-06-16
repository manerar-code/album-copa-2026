# PRD: Trade Registration — Álbum Copa 2026

## Overview

Collectors who complete sticker trades have no way to record the outcome inside the app. They must manually update each sticker one by one after a trade. This feature adds a "Register Trade" modal to the Duplicates screen that processes both sides of a trade in one step: sent stickers are decremented from duplicates (or converted to Owned when only one copy remains), and received stickers are marked as Owned.

**Who it is for:** Collectors who actively trade stickers and need their collection to reflect completed trades quickly.

**Why it is valuable:** A trade changes the collection on both sides simultaneously. Doing it card-by-card today is tedious and error-prone. A single modal interaction eliminates friction and keeps the collection accurate after every trade.

## Goals

- Collectors can record a completed trade — sent and received — in a single action from the Duplicates screen.
- Sent stickers automatically decrement by one unit; when only one copy remains it converts to Owned.
- Received stickers are marked as Owned regardless of previous state.
- The input format reuses the same text syntax collectors already know from the Trades screen.

## User Stories

**Primary — the active trader:**
- As a collector, I want to record which stickers I sent in a trade so my duplicate counts drop automatically without tapping each card individually.
- As a collector, I want to record which stickers I received so they are marked as Owned without navigating to each sticker.
- As a collector, I want to use the same text format I already use in the Trades screen (e.g. `BRA: 1, 2 URU03`) so I do not have to learn a new syntax.

**Secondary — the cautious user:**
- As a collector, I want to confirm the trade before it executes so I do not accidentally update the wrong stickers.
- As a collector, I want to know if a sticker I listed as "sent" is not actually in my duplicates, so I can catch mistakes before confirming.

## Core Features

### 1. "Register Trade" button on Duplicates screen

A button labeled **"🤝 Registrar troca"** appears on the Duplicates screen (alongside the existing WhatsApp share button) when the user has at least one duplicate sticker. Tapping it opens the Trade Registration modal.

### 2. Trade Registration modal

The modal contains:
- **"Enviei" field** — free-text input using the same `BRA: 1, 2` / `BRA01 ARG03` format as the Trades screen.
- **"Recebi" field** — same format.
- **Confirm button** — executes the trade.
- **Cancel button** — closes the modal without any changes.

### 3. Sent stickers — decrement logic

For each sticker listed in "Enviei":
- If current quantity is **≥ 2**: decrement by 1 (×3 → ×2, ×2 → ×1). At ×1, status remains `duplicate` but badge is hidden (existing behavior — badge only shows when > 1).
- If current quantity is **1** (or not set, defaulting to 1): status changes from `duplicate` → `owned`. The sticker leaves the Duplicates screen.
- If sticker is **not in duplicates** (missing or owned): skip silently — no error shown, no change made.

### 4. Received stickers — mark as Owned

For each sticker listed in "Recebi":
- Status is set to `owned` regardless of current state.
- If already `owned` or `duplicate`: no change (idempotent).
- If `missing`: transitions to `owned`.

### 5. Input validation and feedback

- After parsing both fields, show a brief summary before the confirm button: _"3 enviadas · 2 recebidas"_.
- If a sticker code cannot be resolved (unknown country code or number not in catalog): ignore it silently (same behavior as the existing Trades screen parser).
- After confirming, close the modal and return to the updated Duplicates screen.

## User Experience

**Primary flow:**

1. Collector opens the Duplicates screen.
2. Taps **"🤝 Registrar troca"**.
3. Modal opens. Collector types or pastes the sent list in "Enviei" and the received list in "Recebi".
4. Summary line shows parsed count: _"3 enviadas · 2 recebidas"_.
5. Taps **Confirmar**.
6. Modal closes. Duplicates screen refreshes — sent stickers updated, received stickers removed from Duplicates if they became Owned.

**Error/edge cases:**

- Empty "Enviei" field: still valid — user may want to record only received stickers.
- Empty "Recebi" field: still valid — user may want to record only sent stickers.
- Both fields empty: Confirm button is disabled.
- Sticker listed as sent but not in duplicates: skipped silently.

## Non-Goals (Out of Scope)

- Trade history or log — no record is kept after the modal closes.
- Partner name or contact — no social or identity features.
- Decrementing by more than 1 per sticker per trade session.
- Modifying the Trades screen (comparison/matching feature) — only the Duplicates screen is touched.
- Undo/redo of trade registration.
- Notifications or confirmations sent to trade partners.

## Phased Rollout Plan

### MVP (Phase 1)

- "Registrar troca" button on Duplicates screen.
- Modal with "Enviei" and "Recebi" text fields.
- Sent: decrement or convert to Owned as described.
- Received: mark as Owned.
- Summary count before confirm.
- **Success criteria:** Collectors complete a full trade registration in under 30 seconds with zero manual card taps.

### Phase 2 (future, not committed)

- Trade history with date and sticker lists for audit.
- Partner name field for social context.

## Success Metrics

- Collectors use "Registrar troca" at least once per trade session (tracked via usage analytics when available).
- Zero reports of incorrect sticker state after using the feature (duplicate count went negative, sticker disappeared unexpectedly).
- Feature completion time under 30 seconds for a typical 5-sticker trade.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| User sends sticker not in duplicates | Skip silently — no destructive action on non-duplicate stickers |
| User mistypes a sticker code | Parser ignores unresolvable codes (same as Trades screen today) |
| User confirms wrong list | Cancel button always available; no history means no undo, but damage is limited to owned status changes which can be reversed manually |
| Modal too small on compact screens | Two scrollable fields; modal max-height capped with scroll enabled |

## Architecture Decision Records

- [ADR-001: Modal Único com Dois Campos](adrs/adr-001.md) — Modal único na tela de Repetidas com campos "Enviei" e "Recebi" reutilizando o parser existente, preferido sobre dois botões separados ou fluxo pós-compartilhamento.

## Open Questions

- Should the "Registrar troca" button also appear when duplicates list is empty (to record received stickers only)? Current assumption: yes, if the user has any stickers at all — receiving always makes sense.
