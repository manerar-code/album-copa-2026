---
status: pending
title: "Update LGPD/GDPR privacy policy content"
type: docs
complexity: low
dependencies: []
---

# Update LGPD/GDPR privacy policy content


## Overview

The privacy policy at `https://album-copa-2026-sable.vercel.app/privacy-policy` must be updated to satisfy both App Store and Google Play requirements, as well as Brazilian LGPD compliance. The current policy does not explicitly cover: legal basis for processing, international data transfer (Supabase servers in the US), data retention period, account and data deletion mechanism, or DPO contact. Both stores require a compliant privacy policy URL before submission.

<critical>
- ALWAYS READ the PRD (F2.9) and TechSpec "Integration Points" section before starting
- FOCUS ON "WHAT" — update the policy content on the Vercel-hosted page
- NO CODE CHANGES — this is a content update to the hosted privacy policy page
- TESTS REQUIRED — verify the URL is live and contains required sections
</critical>

<requirements>
1. The privacy policy page MUST be publicly accessible at the URL in `app.json` `privacyPolicyUrl`.
2. The policy MUST include: legal basis for data processing under LGPD (Art. 7).
3. The policy MUST include: international data transfer disclosure (Supabase infrastructure in the US).
4. The policy MUST include: data retention period (how long user data is kept).
5. The policy MUST include: account and data deletion mechanism (how users can request deletion).
6. The policy MUST include: DPO/contact information for data-related requests.
7. App Store Connect "App Privacy" questionnaire MUST be filled with: Contact Info (email), Identifiers (user ID), Usage Data (sticker collection).
</requirements>

## Subtasks

- [ ] 15.1 Identify the source file for the privacy policy page in the Vercel project
- [ ] 15.2 Add LGPD legal basis section (Art. 7 — legitimate interest or consent)
- [ ] 15.3 Add international transfer disclosure (Supabase US servers)
- [ ] 15.4 Add data retention period (e.g., "data retained until account deletion")
- [ ] 15.5 Add account deletion instructions (e.g., email request process)
- [ ] 15.6 Add DPO/contact email for privacy requests
- [ ] 15.7 Deploy updated page to Vercel and verify URL is live
- [ ] 15.8 (Manual) Fill App Store Connect App Privacy questionnaire

## Implementation Details

Content update to the Vercel-hosted privacy policy page. No changes to the React Native app source code. The `privacyPolicyUrl` in `app.json` already points to the correct URL.

### Relevant Files
- Privacy policy source in the Vercel project (HTML or JSX page)
- `app.json` — `privacyPolicyUrl` (verify URL is correct, no code change needed)

## Deliverables

- Updated privacy policy live at `https://album-copa-2026-sable.vercel.app/privacy-policy`
- Policy covers all 5 required LGPD fields
- App Store Connect App Privacy questionnaire completed

## Tests

### Unit Tests
- [ ] Privacy policy URL returns HTTP 200
- [ ] Policy page contains "LGPD" or "Lei Geral de Proteção de Dados"
- [ ] Policy page contains international transfer disclosure
- [ ] Policy page contains data deletion instructions

### Integration Tests
- [ ] App Store Connect accepts the privacy policy URL without validation error
- [ ] Google Play Console accepts the privacy policy URL

## Success Criteria

- All tests passing
- Privacy policy live and covers all required sections
- Both stores accept the privacy policy URL during submission
