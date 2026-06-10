---
status: completed
title: "F1 — EAS secrets: remover credenciais do eas.json"
type: infra
complexity: medium
dependencies: []
---

# Task 1: F1 — EAS secrets: remover credenciais do eas.json

## Overview

Remove as credenciais Supabase em texto puro do `eas.json` e as migra para o armazenamento criptografado de secrets do EAS. A chave anon do Supabase deve ser rotacionada após a remoção para invalidar qualquer exposição anterior. Adicionalmente, a proteção em `supabase.ts` é reforçada para falhar explicitamente em dev se as variáveis estiverem ausentes.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "F1 — Credential & Secret Protection" for implementation details
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST remove EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY plaintext values from eas.json production env block
- MUST create EAS secrets via `eas secret:create` for both variables before removing plaintext values (ensures build pipeline is not broken)
- MUST update eas.json to reference secrets using "$VAR_NAME" syntax
- MUST rotate the Supabase anon key in the Supabase dashboard after secrets are set
- MUST update the EAS secret with the new rotated key
- MUST verify ./secrets/service-account-key.json is in .gitignore
- MUST update supabase.ts to throw an Error in development when EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing
- SHOULD remove any committed .env files from git history using git filter-repo or BFG
- SHOULD add .env* pattern to .gitignore if not present
</requirements>

## Subtasks

- [ ] 1.1 Create EAS secrets for EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY via `eas secret:create` ⚠️ MANUAL — run `eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value <url>` and same for ANON_KEY before pushing
- [x] 1.2 Update eas.json production `env` block to use `"$EXPO_PUBLIC_SUPABASE_URL"` and `"$EXPO_PUBLIC_SUPABASE_ANON_KEY"` references
- [ ] 1.3 Rotate Supabase anon key in dashboard and update EAS secret with the new value ⚠️ MANUAL — Supabase Dashboard → Project Settings → API → Regenerate; update Vercel env var BEFORE git push
- [x] 1.4 Add hard-fail guard in `supabase.ts` for missing env vars (throws in dev, warns in prod)
- [x] 1.5 Verify `.gitignore` covers `.env*` and `secrets/`; remove any committed .env file from git history — .gitignore already correct; no committed .env found

## Implementation Details

See TechSpec section "Phase 1 — F1 — Credential & Secret Protection" for exact CLI commands and the `supabase.ts` code change.

Key constraint: EAS secrets must exist BEFORE removing plaintext values from eas.json. Rotating the Supabase key must happen atomically with updating the Vercel env var so the deployed web app is not broken.

### Relevant Files

- `eas.json` — contains the plaintext `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to be removed
- `src/shared/services/supabase.ts` — reads env vars; needs dev-only guard added
- `.gitignore` — must include `.env*` and `secrets/` patterns

### Dependent Files

- `src/shared/services/supabase.ts` — any build that runs after key rotation depends on the new key being in the EAS secret and Vercel env

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — F1 is Phase 1, must complete before F2 (RLS testing requires stable credentials)

## Deliverables

- `eas.json` with no plaintext credentials — only `"$VAR"` references
- Updated EAS secrets for both Supabase env vars (new rotated key)
- `supabase.ts` with explicit missing-env guard
- `.gitignore` updated
- Unit test for the supabase.ts guard behavior

## Tests

- Unit tests:
  - [ ] `supabase.ts` with both env vars set returns a valid Supabase client (mock `process.env`)
  - [ ] `supabase.ts` with EXPO_PUBLIC_SUPABASE_URL missing throws Error in NODE_ENV=development
  - [ ] `supabase.ts` with EXPO_PUBLIC_SUPABASE_ANON_KEY missing throws Error in NODE_ENV=development
- Integration tests:
  - [ ] `eas build --profile=production --platform=ios --dry-run` completes without missing secret error (manual CLI verification)
  - [ ] App deployed to Vercel after key rotation still authenticates successfully (manual smoke test)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `npm run lint` passes with zero errors
- `cat eas.json | grep -E "eyJ|supabase.co"` returns no matches
- Supabase anon key in dashboard shows a new value (rotated)
- EAS secret list shows both variables: `eas secret:list`
