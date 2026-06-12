---
status: completed
title: "F5a — Migration: tabela account_deletion_requests"
type: backend
complexity: medium
dependencies:
  - task_03
---

# Task 7: F5a — Migration: tabela account_deletion_requests

## Overview

Cria a tabela `account_deletion_requests` no Supabase com o schema definido no ADR-002. Esta tabela registra pedidos de exclusão de conta com timestamps de solicitação, prazo de exclusão (30 dias), cancelamento e conclusão. RLS isola os dados por usuário; o job de limpeza usa a `service_role` key para acesso privilegiado.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F5 — Data Model" and ADR-002 for the exact schema
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create table with columns: id (UUID PK), user_id (UUID FK → auth.users ON DELETE CASCADE), requested_at (TIMESTAMPTZ DEFAULT now()), scheduled_delete_at (TIMESTAMPTZ NOT NULL), cancelled_at (TIMESTAMPTZ nullable), completed_at (TIMESTAMPTZ nullable), reminder_sent_at (TIMESTAMPTZ nullable)
- MUST enable RLS on the table
- MUST create a FOR ALL RLS policy: `USING (user_id = auth.uid())`
- MUST create migration file in `supabase/migrations/` for version control
- SHOULD verify the table structure is correct via `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'account_deletion_requests'`
</requirements>

## Subtasks

- [x] 7.1 Create `supabase/migrations/20260610_account_deletion_requests.sql` with CREATE TABLE, RLS enable, and policy
- [ ] 7.2 Apply the migration to the Supabase project via SQL editor or `supabase db push`
- [ ] 7.3 Verify table schema in Supabase Dashboard → Table Editor
- [ ] 7.4 Verify RLS is active: INSERT a row as user A, query as user B — expect 0 rows

## Implementation Details

See TechSpec section "Phase 2 — F5 — Data Model" for the exact SQL CREATE TABLE statement and ADR-002 for the schema rationale.

The `scheduled_delete_at` value is computed by the application layer as `requested_at + 30 days` — not a DB default, because the app needs to display this value immediately after insert.

### Relevant Files

- `supabase/migrations/` — create directory if not present; write migration file here

### Dependent Files

- `task_08` (accountDeletionService) — the service INSERT/SELECT/UPDATE statements depend on this table existing
- `task_10` (Edge Functions) — the cleanup function queries this table with `service_role` key

### Related ADRs

- [ADR-002: Dedicated Table for Account Deletion State](adrs/adr-002.md) — full schema design rationale and rejected alternatives

## Deliverables

- `supabase/migrations/YYYYMMDD_account_deletion_requests.sql`
- Verified table in Supabase Dashboard with RLS toggle ON

## Tests

- Unit tests:
- [x] No unit test applicable — database migration; tested via integration
- [ ] Integration tests:
  - [ ] INSERT into `account_deletion_requests` with valid `user_id = auth.uid()` succeeds
  - [ ] SELECT from `account_deletion_requests` as a different user returns 0 rows (RLS enforcement)
  - [ ] INSERT with `user_id` different from `auth.uid()` is rejected by RLS WITH CHECK policy
  - [ ] DELETE of `auth.users` row causes CASCADE delete of corresponding `account_deletion_requests` row
- Test coverage target: N/A (DB migration)
- All tests must pass

## Success Criteria

- Migration file committed to `supabase/migrations/`
- Table visible in Supabase Dashboard with all 7 columns
- RLS enabled and policy active
- `npm test` passes with no regressions
