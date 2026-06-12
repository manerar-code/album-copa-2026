---
status: completed
title: "F2 — RLS policies em user_collections e user_albums"
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 3: F2 — RLS policies em user_collections e user_albums

## Overview

Habilita Row Level Security (RLS) nas tabelas `user_collections` e `user_albums` do Supabase e cria políticas que restringem cada usuário ao acesso exclusivo dos seus próprios dados. Sem RLS, qualquer usuário autenticado pode ler ou modificar dados de outros usuários, o que é uma vulnerabilidade crítica de segurança.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 1 — F2 — Row-Level Security" for SQL statements
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST enable RLS on `user_collections` table: `ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY`
- MUST enable RLS on `user_albums` table: `ALTER TABLE user_albums ENABLE ROW LEVEL SECURITY`
- MUST create FOR ALL policy on `user_collections` with `USING (user_id = auth.uid())`
- MUST create FOR ALL policy on `user_albums` with `USING (user_id = auth.uid())`
- MUST verify that a query run as user B cannot return rows owned by user A
- SHOULD create a migration file in `supabase/migrations/` for version control of the SQL change
- SHOULD NOT break the existing app behavior — all existing Supabase calls already filter by user_id, so RLS adds enforcement without requiring app code changes
</requirements>

## Subtasks

- [x] 3.1 Create migration file `supabase/migrations/20260610_rls_policies.sql` with ALTER TABLE and CREATE POLICY statements for both tables
- [x] 3.2 Apply the migration to the Supabase project via SQL editor or `supabase db push`
- [x] 3.3 Verify RLS is active: query `SELECT * FROM user_collections WHERE user_id != auth.uid()` as a logged-in user and confirm 0 rows returned
- [x] 3.4 Smoke-test the app: mark a figurinha, navigate away, return — collection data still loads correctly

## Implementation Details

See TechSpec section "Phase 1 — F2 — Row-Level Security" for the exact SQL statements for both tables.

Note: `account_deletion_requests` table (task_07) will need its own RLS policy — that policy is out of scope here and is included in task_07.

The existing app queries (`cloudCollectionService`, `userAlbumService`) already pass `user_id` in WHERE clauses. After enabling RLS, the database enforces what the app was already implementing in code — no app-side changes needed.

### Relevant Files

- `supabase/migrations/` — create this directory if it does not exist; write the migration file here
- `src/shared/services/cloudCollectionService.ts` — calls Supabase with user-scoped queries; should continue working unchanged after RLS
- `src/modules/auth/services/` — contains services that interact with `user_albums`

### Dependent Files

- `task_07` (account_deletion_requests migration) — depends on RLS being active first; the new table's RLS policy will follow the same pattern

### Related ADRs

- [ADR-001: Phased Sequential Implementation](adrs/adr-001.md) — Phase 1; RLS must be live before Phase 2 account deletion

## Deliverables

- `supabase/migrations/YYYYMMDD_rls_policies.sql` with RLS statements for user_collections and user_albums
- Manual verification log (included in commit message): result of cross-user query returning 0 rows

## Tests

- Unit tests:
  - [x] No unit test applicable — RLS is enforced at the database level; app-level unit tests mock Supabase and do not exercise DB policies
- Integration tests:
  - [x] Query `SELECT COUNT(*) FROM user_collections WHERE user_id != auth.uid()` returns 0 when executed with a valid user JWT
  - [x] Query `SELECT COUNT(*) FROM user_albums WHERE user_id != auth.uid()` returns 0 when executed with a valid user JWT
  - [x] App smoke test: collection loads correctly for the authenticated user after RLS is enabled
  - [x] App smoke test: marking a figurinha persists correctly after RLS is enabled
- Test coverage target: N/A (DB migration; app code unchanged)
- All tests must pass

## Success Criteria

- All tests passing
- RLS enabled status visible in Supabase Dashboard → Table Editor → user_collections → RLS toggle = ON
- RLS enabled status visible for user_albums → RLS toggle = ON
- Cross-user query returns 0 rows (verified manually or via Supabase SQL editor)
- `npm test` passes with no regressions after the change
