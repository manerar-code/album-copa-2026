# PRD: Bug Fixes — Álbum Copa 2026

**Version:** 1.0  
**Date:** 2026-06-02  
**Status:** Draft  
**Owner:** attriadigital  

---

## Overview

This document defines the requirements for correcting 10 identified bugs in the Álbum Copa 2026 app. All bugs were discovered during testing on the web version (Safari) and on iOS via TestFlight. The fixes will be delivered as a single development cycle, resulting in one new build submitted to TestFlight.

---

## Goals

- Eliminate all 10 known bugs before the app reaches a wider audience.
- Ensure the iOS build renders correctly on TestFlight.
- Make all user-facing interactions (editing, saving, deleting) reliable and visually correct.
- Enforce business rules around sticker types and cross-album duplicate signaling.

---

## User Stories

1. As a user on iOS, I want the app to display its content when I open it from TestFlight, so I can use the app on my iPhone.
2. As a user configuring my profile, I want to see the text I type in input fields, so I can confirm what I am entering.
3. As a user editing my name, I want the Save button to be visible and functional, so I can persist my changes.
4. As a user managing my albums, I want to delete an album and have it removed from the list, so I can keep my collection organized.
5. As a user editing an album, I want to see the current album name pre-filled in the edit field, so I know what I am changing.
6. As a user on the home screen, I want to tap the album selector without it being blocked by the profile button, so I can switch albums freely.
7. As a user with stickers marked as duplicate in Album A, I want to see those stickers highlighted in Album B, so I know I can mark them as owned.
8. As a user marking a sticker as owned in Album B (from a duplicate in Album A), I want to be asked if I want to update Album A, so I can keep both albums consistent.
9. As a user browsing sticker types, I want to see "Brilhante" instead of "Foil" in all labels, so the interface is in my language.
10. As a user in the type settings, I want Player, Brilhante, and Silver to always appear first and always be checked, so I understand these types are mandatory.
11. As a user in the type settings modal, I want all checkboxes to show their label and border, so I can read and interact with each option.

---

## Core Features

### BUG-01 — iOS Black Screen on TestFlight
The app renders a black screen when opened via TestFlight. The fix must ensure the app initializes and renders its home screen correctly on iOS with the current build configuration (New Architecture setting, Xcode image, reanimated version).

### BUG-02 — Invisible Text in Input Fields
When editing any text field (e.g., user name), the text color matches the background color, making typed content invisible. All TextInput components must display text in a color that contrasts with their background, consistent with the app's dark design system (primary background `#0A2342`).

### BUG-03 — Save Button for User Name: Non-functional and Off-Screen
The Save button in the user name edit flow does not execute the save action and is positioned outside the visible screen area. The button must be visible within the screen bounds and successfully persist the updated name when tapped.

### BUG-04 — Album Delete Does Not Work
Tapping the delete icon on an album does not remove it. The delete action must remove the album from the list and, if the deleted album was active, switch the user to another available album.

### BUG-05 — Album Name Not Pre-filled on Edit Screen
When opening the album edit screen, the name field is empty instead of showing the current album name. The field must be pre-filled with the existing album name so the user can edit from the current value.

### BUG-06 — Album Selector Overlapped by Profile Button
On the Home screen and Album screen, the profile button (absolute-positioned, top-right) overlaps the album selector chip, making the selector unreachable. The layout must ensure both elements are accessible without overlap.

### BUG-07 — Cross-Album Duplicate Signaling
When a sticker is marked as duplicate in Album A, it is not visually indicated in Album B. The expected behavior:
- Stickers that are duplicate in another album must be highlighted in red in the current album view.
- Tapping a highlighted sticker marks it as "owned" in the current album.
- The app then displays a confirmation dialog asking the user if they want to update the status of that sticker in Album A to "owned" (removing the duplicate mark).
- If confirmed, the sticker in Album A changes from "duplicate" to "owned".
- The dialog must use the existing app layout, colors, and component styles.

### BUG-08 — "Foil" Label Must Display as "Brilhante"
Anywhere the label "Foil" appears to the user (badges, lists, modals), it must display as "Brilhante". The internal data value remains unchanged. Any screen that bypasses the existing `displayType()` function must be updated to use it.

### BUG-09 — Mandatory Types in Type Settings Modal
In the "Ative tipos" (type settings) modal:
- Player, Brilhante (Foil), and Silver must always appear at the top of the list.
- These three types must always be checked and cannot be unchecked by the user.
- Their checkboxes must be visually distinct (e.g., disabled/locked appearance) to communicate they are mandatory.

### BUG-10 — Checkboxes Without Label and Border in Type Settings Modal
In the "Ative tipos" modal, configurable type items appear without a visible text label and without a border. Each item must display its type name and a clear checkbox border, consistent with the app's design system.

---

## User Experience

- All fixes must preserve the existing visual identity: dark background `#0A2342`, accent colors `#2ECC71` and `#F1C40F`, and existing component styles.
- The cross-album confirmation dialog (BUG-07) must use the same modal pattern and color palette already present in the app — no new design language.
- Mandatory type checkboxes (BUG-09) must communicate their locked state clearly without removing them from the list — a visual cue (e.g., lock icon, reduced opacity on the toggle) is sufficient.
- The Save button (BUG-03) must be within the safe area of the screen on all iPhone screen sizes.
- Text in all input fields must be legible against their background at all times.

---

## Non-Goals

- No new features beyond what is described above.
- No changes to the data model or Supabase schema.
- No changes to Android behavior unless the same fix resolves a cross-platform bug.
- No redesign of existing screens — only targeted corrections.
- No changes to the internal type names stored in the database ("Foil Player" remains as-is).

---

## Phased Rollout Plan

All fixes are delivered in a single development cycle:

1. Develop and test all 10 fixes locally (web).
2. Run a full regression on the web version (Safari) to confirm no regressions.
3. Generate a new iOS build via EAS (`npx eas build --platform ios --profile production`).
4. Submit to TestFlight (`npx eas submit --platform ios --latest`).
5. Validate BUG-01 (black screen) and core flows on a physical iPhone via TestFlight.

---

## Success Metrics

- The app opens and renders correctly on iOS via TestFlight (BUG-01 resolved).
- All 10 bugs are no longer reproducible on the web version (Safari).
- No new bugs introduced in screens touched by the fixes.
- A new TestFlight build is successfully submitted and approved by Apple.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| New iOS build fails due to dependency issues | Keep Xcode image and reanimated version stable; test build configuration before submitting. |
| Cross-album logic (BUG-07) causes unintended state changes | Add confirmation dialog before any status mutation across albums. |
| Fixing overlap (BUG-06) breaks layout on other screen sizes | Test on at least two iPhone screen sizes (small and large). |
| Mandatory type lock (BUG-09) confuses users | Add a brief tooltip or locked visual state to explain why these types cannot be unchecked. |

---

## Architecture Decision Records

- [ADR-001: Bug Fix Delivery Strategy — Big Bang](adrs/adr-001.md) — All 10 bugs corrected in a single development cycle and delivered as one TestFlight build.

---

## Open Questions

- None. All ambiguities were resolved during the PRD brainstorming session.
