---
status: in_progress
title: "F9 — Metadados das lojas (App Store + Google Play)"
type: chore
complexity: low
dependencies:
    - task_06
---

# Task 13: F9 — Metadados das lojas (App Store + Google Play)

## Overview

Preenche todos os metadados obrigatórios no App Store Connect e no Google Play Console, incluindo descrições, palavras-chave, screenshots, URL da política de privacidade e a seção Data Safety do Google Play. Esta task é manual — não gera código — mas é bloqueante para a submissão.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 3 — F9 — Store Metadata" for all required values and the Data Safety field table
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST fill App Store Connect: app name, subtitle (optional), description (≤4000 chars), keywords (≤100 chars), privacy policy URL, category, age rating, release notes
- MUST fill Google Play Console: app name, short description (≤30 chars), long description (≤4000 chars), privacy policy URL, category, screenshots, Data Safety section
- MUST take and upload minimum 3 screenshots per device size: iPhone 6.7", iPhone 5.5" (if required), Android phone — showing Home stats, Album list, and Team detail with stickers marked
- MUST complete the Google Play Data Safety form declaring: email address collected, name collected, app interactions (sticker collection) collected
- MUST enter `https://album-copa-2026-sable.vercel.app/privacidade` as Privacy Policy URL in both stores
- SHOULD set release notes to "Versão inicial — Monte sua coleção da Copa do Mundo 2026" in both stores
</requirements>

## Subtasks

- [x] 13.1 Prepare all text metadata (app name, description, keywords, release notes) in a local text file for copy-paste
- [ ] 13.2 Capture screenshots on iOS simulator (iPhone 15 Pro Max 6.7") and Android emulator (Pixel 7)
- [ ] 13.3 Fill App Store Connect listing completely and save (do not submit yet)
- [ ] 13.4 Fill Google Play Console listing and complete the Data Safety section
- [x] 13.5 Verify Privacy Policy URL returns 200 in both store consoles

## Implementation Details

See TechSpec section "Phase 3 — F9 — Store Metadata" for the exact text values, keyword string, Data Safety field table, and screenshot screen list.

Screenshots must show: (1) Home screen with collection stats, (2) Album screen with team list, (3) Team detail screen with figurinhas marked in different states (missing/owned/duplicate).

The Data Safety section is manual and cannot be pre-filled via EAS or CLI — it must be completed by the account holder in Play Console.

Note: `eas submit` automates binary upload but NOT metadata. Metadata must be entered manually in the store dashboards.

### Relevant Files

- No code files — all deliverables are in the store consoles
- `public/privacidade.html` (task_06 output) — the URL must be live before filling this task

### Dependent Files

None — this task produces no code changes.

### Related ADRs

None applicable.

## Deliverables

- App Store Connect listing 100% complete (all required fields filled, ready for submission)
- Google Play Console listing 100% complete including Data Safety section
- Screenshots uploaded for all required device sizes
- Privacy Policy URL verified in both stores

## Tests

- Unit tests:
  - [ ] No unit test applicable — manual store console configuration
- Integration tests:
  - [ ] App Store Connect shows 0 missing required fields in the "App Information" and "Pricing and Availability" sections
  - [ ] Google Play Console shows "Complete" status for the store listing section and Data Safety section
  - [ ] Privacy Policy URL accessible from both store consoles (manual click-through verification)
- Test coverage target: N/A
- All tests must pass

## Success Criteria

- Both store listings show "Ready to Submit" / "Complete" status
- Privacy Policy URL live and accessible
- All required screenshots uploaded at correct device sizes
- Google Play Data Safety section submitted (not draft)
