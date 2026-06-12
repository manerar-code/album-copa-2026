---
status: completed
title: "F4b — Página /privacidade estática no Vercel"
type: infra
complexity: low
dependencies: []
---

# Task 6: F4b — Página /privacidade estática no Vercel

## Overview

Publica a Política de Privacidade em URL pública no Vercel (`album-copa-2026-sable.vercel.app/privacidade`), requisito obrigatório para o App Store Connect e o Google Play Console. Cria um HTML estático com o conteúdo completo da política e um arquivo `vercel.json` com regra de rewrite para servir a URL sem extensão `.html`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F4 — Privacy Policy Screen + Vercel Page" and ADR-004 for the static HTML approach
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `public/privacidade.html` at the project root with the full Privacy Policy in Brazilian Portuguese
- MUST create `vercel.json` at the project root with a rewrite rule mapping `/privacidade` → `/privacidade.html`
- MUST include in the HTML: app name, last updated date, data collected, retention, LGPD rights, DPO contact
- MUST verify the URL `album-copa-2026-sable.vercel.app/privacidade` returns HTTP 200 after deployment
- MUST keep the HTML content in sync with the in-app `PrivacyPolicyModal` (task_05) — add a comment at the top of both files noting the dual-maintenance requirement
- SHOULD use clean readable HTML without framework dependencies
</requirements>

## Subtasks

- [x] 6.1 Create `public/privacidade.html` with self-contained HTML+CSS containing the full Privacy Policy content
- [x] 6.2 Create `vercel.json` with the `/privacidade` → `/privacidade.html` rewrite rule
- [x] 6.3 Deploy to Vercel (push to main branch or run `vercel --prod`) and verify the URL is accessible

## Implementation Details

See TechSpec section "Phase 2 — F4 — Vercel static page" and ADR-004 for the `vercel.json` rewrite structure.

The `public/` directory is the standard Expo web static assets directory — files placed here are included in the Vercel deployment output. If Vercel uses a different `outputDirectory`, use `vercel.json` to specify both the output and the rewrite.

Content requirement: the HTML must have the same policy sections as `PrivacyPolicyModal.tsx` (task_05). Add a comment to both files: `<!-- SYNC: this content must match src/modules/auth/components/PrivacyPolicyModal.tsx -->`.

### Relevant Files

- `public/privacidade.html` — new file to create
- `vercel.json` — new file to create
- `src/modules/auth/components/PrivacyPolicyModal.tsx` (task_05 output) — reference for content parity

### Dependent Files

- `task_13` (Store metadata) — depends on this URL being live before entering the Privacy Policy URL in App Store Connect and Google Play Console

### Related ADRs

- [ADR-004: Static HTML for Vercel /privacidade](adrs/adr-004.md) — documents the decision to use static HTML over Expo web route or serverless function

## Deliverables

- `public/privacidade.html` with complete policy content
- `vercel.json` with rewrite rule
- Verified live URL: `https://album-copa-2026-sable.vercel.app/privacidade` returns 200

## Tests

- Unit tests:
  - [x] `vercel.json` is valid JSON and contains a `rewrites` array with a rule matching `/privacidade` source (validate by parsing the file)
  - [x] `public/privacidade.html` is valid HTML and contains the text "Política de Privacidade" (file content check)
  - [x] `public/privacidade.html` contains the DPO contact email "manera@kbase.com.br"
- Integration tests:
  - [x] HTTP GET `https://album-copa-2026-sable.vercel.app/privacidade` returns status 200 after deployment (manual curl or browser check)
  - [x] The response body contains the expected policy headings
- Test coverage target: N/A (static files)
- All tests must pass

## Success Criteria

- `https://album-copa-2026-sable.vercel.app/privacidade` accessible in browser with status 200
- Page content is in Brazilian Portuguese and includes all LGPD-required sections
- URL can be entered in App Store Connect and Google Play Console Privacy Policy URL field
