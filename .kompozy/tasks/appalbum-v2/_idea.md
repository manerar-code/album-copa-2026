# AppAlbum Copa 2026 — v2 Idea

## Product Summary

AppAlbum is a mobile app (React Native + Expo + Supabase) for sticker album collectors of the FIFA World Cup 2026. v1 delivered the functional core: a full sticker catalog, three-state tracking per sticker (missing / owned / duplicate), cloud sync, multi-album support, and Google OAuth. v2 fixes the experience gaps in v1 and adds a social trading layer.

## Target Users

- **Casual collector (teen):** Buys packs with parents, wants to know what they're missing so they can ask friends for trades.
- **Advanced collector (adult):** Buys full boxes, has many duplicates, wants to trade efficiently and track progress in detail.
- **New user:** Downloaded the app but doesn't understand the sticker states without guidance.

## Problem Statement

| # | Problem in v1 | User impact |
|---|---|---|
| 1 | No onboarding — new users don't know what to do | High early drop-off |
| 2 | Blank screen on first load | App feels broken |
| 3 | No way to trade stickers with other users | Critical missing social feature |
| 4 | No export of the missing list | Users write it down or take screenshots |
| 5 | Expo Go bundle timeout on iOS | Blocks mobile testers |
| 6 | Incomplete offline mode (no sync queue) | Data loss when connection drops |
| 7 | No transition animations | App feels static |
| 8 | Stats limited to overall totals | Hard to track real progress by team or type |
| 9 | No progress notifications | Users don't return spontaneously |

## Features to Build

### P0 — Critical (quality blockers)

**F-01: Loading Skeletons**
Replace blank screens with animated skeleton screens in AlbumList, TeamDetail, Home, Missing, and Duplicates screens. Skeletons must mirror the real layout. No blank area visible for more than 200ms after navigation.

**F-02: Native Build via EAS**
Configure EAS Build with development, preview, and production profiles. Preview build runs standalone without Expo Go. App cold starts in under 3 seconds on a physical device.

**F-03: Offline Queue with Auto-Sync**
Every sticker state change that fails to reach Supabase is queued in local storage. Queue drains automatically in FIFO order when connectivity is restored (detected via NetInfo). A visual indicator shows pending sync in the screen header.

### P1 — High priority (v2 core)

**F-04: Interactive Onboarding**
Shown only on first launch (flag persisted locally). Three steps with illustration, title, and short description:
1. "Tap to mark" — demonstrates the missing → owned → duplicate cycle
2. "See what's missing" — introduces the Missing tab
3. "Trade with friends" — introduces the trading system
Each step has a "Skip" button. Horizontal transition animation between steps.

**F-05: Sticker Trading System**
A new Trades tab lists users whose duplicates match the current user's missing stickers, and vice versa. Match is calculated server-side. Each match shows the partner's name and a "Copy list for WhatsApp" button that generates a formatted text list. Users can opt out of visibility in Settings. Match results return in under 2 seconds for the full catalog of ~670 stickers.

**F-06: Missing List Export**
An Export button on the Missing screen. Two formats:
- **Text:** formatted list copied to clipboard ("Brazil: 3, 7, 12 | Argentina: 5, 9")
- **Image:** screenshot of the current list shared via the native share sheet
Export respects active type filters. Generates in under 1 second.

**F-07: State Transition Animations**
Tapping a sticker card animates the color change with a 150ms fade. Completing the album (100%) triggers a confetti animation for 3 seconds. Tab transitions use a smooth fade. Animations must maintain 60fps on mid-range devices.

### P2 — Desirable (if capacity allows)

**F-08: Advanced Statistics**
Redesigned Stats screen with:
- Horizontal bar chart: progress by team (top 10 and bottom 10)
- Breakdown by sticker type: % owned and duplicate per type
- Progress timeline: cumulative daily progress chart
History requires a daily progress log persisted in the backend.

**F-09: Progress Milestone Notifications**
Local push notifications at 25%, 50%, 75%, and 100% album completion. Calculated on-device after sync. User can disable in Settings. Notification fires within 5 seconds of reaching a milestone.

## Explicit Non-Goals

- Albums for future events beyond Copa 2026
- Real-time chat between users
- Integration with external marketplaces (e.g., Mercado Livre)
- Gamification (points, global rankings, badges)
- Standalone desktop version
- Camera OCR to recognize stickers

## Current Tech Stack (v1)

- React Native 0.85 + Expo SDK 56
- TypeScript (strict mode, zero `any`)
- Zustand (global state)
- Supabase (Auth, PostgreSQL, Realtime)
- React Navigation (bottom tabs + stack)
- Reanimated 3 (already present)
- AsyncStorage (local persistence)

## Success Metrics

- Crash-free sessions ≥ 99%
- Cold start under 3s in ≥ 95% of sessions
- D7 retention ≥ 40%
- ≥ 30% of active users use the Trades feature
- ≥ 500 export events in 30 days
- Zero P0 bugs in production
- Test coverage ≥ 80%

## Open Questions

- OQ-1: Should the trade match be anonymous (name only) or show contact info (email/phone)?
- OQ-2: Should the exported image include the user's name or album name as a watermark?
- OQ-3: Should progress log be populated by a Supabase trigger or by the client?
- OQ-4: Should milestone notifications be local or via push service (FCM/APNs)?
- OQ-5: Should onboarding be re-viewable via Settings or only shown on first launch?
