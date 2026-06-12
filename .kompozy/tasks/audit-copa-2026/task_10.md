---
status: completed
title: "F5d — Edge Functions: emails de exclusão + cron diário"
type: backend
complexity: high
dependencies:
  - task_07
---

# Task 10: F5d — Edge Functions: emails de exclusão + cron diário

## Overview

Implementa duas Supabase Edge Functions em Deno/TypeScript: `send-deletion-confirmation` (chamada pelo app ao criar o pedido de exclusão) e `process-pending-deletions` (agendada via pg_cron para rodar diariamente às 02:00 UTC). A primeira envia o email de confirmação via Resend; a segunda executa as exclusões vencidas e envia lembretes de 3 dias.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 2 — F5 — Edge Functions" and ADR-003 for the exact implementation pattern
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `supabase/functions/send-deletion-confirmation/index.ts` that receives `{ email, userName, scheduledDeleteAt }` and sends a confirmation email via Resend API
- MUST create `supabase/functions/process-pending-deletions/index.ts` that: (1) deletes user data for rows where `scheduled_delete_at <= NOW()` and `completed_at IS NULL` and `cancelled_at IS NULL`; (2) sends reminder emails for rows where deletion is in ≤ 3 days and `reminder_sent_at IS NULL`
- MUST store `RESEND_API_KEY` as a Supabase Edge Function secret via `supabase secrets set RESEND_API_KEY=<key>`
- MUST enable pg_cron extension in Supabase and schedule `process-pending-deletions` to run daily at 02:00 UTC
- MUST run permanent deletion inside a transaction: delete `user_collections`, `user_albums`, call `supabase.auth.admin.deleteUser(userId)`, set `completed_at`
- MUST set `reminder_sent_at` after sending reminder email to prevent duplicate sends
- Email delivery failure MUST NOT block the deletion from proceeding
- SHOULD test Edge Functions locally with `supabase functions serve` before deploying
</requirements>

## Subtasks

- [x] 10.1 Create `supabase/functions/send-deletion-confirmation/index.ts` with Resend email sending logic
- [x] 10.2 Create `supabase/functions/process-pending-deletions/index.ts` with cleanup and reminder logic
- [ ] 10.3 Set `RESEND_API_KEY` secret via `supabase secrets set` and create a Resend account/API key (manual step)
- [x] 10.4 Enable pg_cron extension and schedule the cron job in Supabase SQL editor (migration created)
- [ ] 10.5 Test both functions locally with `supabase functions serve` and deploy with `supabase functions deploy` (manual step)

## Implementation Details

See TechSpec section "Phase 2 — F5 — Edge Functions" and ADR-003 for implementation patterns, cron SQL, and retry strategy.

Resend free tier limits: 3,000 emails/month, 100/day — sufficient for launch.

The permanent deletion flow in `process-pending-deletions` uses the `service_role` key (automatically available in Supabase Edge Functions via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`).

pg_cron setup (run in Supabase SQL editor):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```
Then schedule via the `cron.schedule` function — see TechSpec for exact SQL.

Local testing: `supabase functions serve send-deletion-confirmation` and invoke via curl or Insomnia with a test payload.

### Relevant Files

- `supabase/functions/send-deletion-confirmation/index.ts` — new file
- `supabase/functions/process-pending-deletions/index.ts` — new file
- `supabase/migrations/YYYYMMDD_pg_cron_schedule.sql` — optional migration for the cron schedule

### Dependent Files

- `task_08` (`accountDeletionService.requestDeletion`) — calls `send-deletion-confirmation` via `supabase.functions.invoke`; the function must be deployed for the full flow to work in production

### Related ADRs

- [ADR-003: Supabase Edge Function + Resend for Deletion Emails](adrs/adr-003.md) — technology choice, retry strategy, and failure behavior

## Deliverables

- `supabase/functions/send-deletion-confirmation/index.ts`
- `supabase/functions/process-pending-deletions/index.ts`
- Resend account created and `RESEND_API_KEY` set as Supabase secret
- pg_cron scheduled and verified in Supabase Dashboard

## Tests

- Unit tests:
  - [x] `send-deletion-confirmation`: receives valid `{ email, userName, scheduledDeleteAt }` → Resend API called with correct `to`, `subject`, and non-empty `html` (mock `Resend` constructor)
  - [x] `send-deletion-confirmation`: Resend API error → function returns `{ ok: false, error: "..." }` without throwing
  - [x] `process-pending-deletions`: row with `scheduled_delete_at <= NOW()`, no `cancelled_at`, no `completed_at` → delete queries run for `user_collections` and `user_albums`, `auth.admin.deleteUser` called, `completed_at` set (mock Supabase client)
  - [x] `process-pending-deletions`: row with `scheduled_delete_at > NOW()` → deletion NOT triggered
  - [x] `process-pending-deletions`: row with `cancelled_at IS NOT NULL` → deletion NOT triggered
  - [x] `process-pending-deletions`: row in 3-day reminder window and `reminder_sent_at IS NULL` → reminder email sent and `reminder_sent_at` set
  - [x] `process-pending-deletions`: row with `reminder_sent_at IS NOT NULL` → reminder email NOT sent again
- Integration tests:
  - [ ] Invoke `send-deletion-confirmation` locally via `supabase functions serve` with test payload → Resend test delivery succeeds (manual)
  - [ ] Invoke `process-pending-deletions` manually with a row where `scheduled_delete_at = NOW() - 1 minute` → row `completed_at` is set in DB (manual integration test)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Both Edge Functions deployed: `supabase functions list` shows both functions
- pg_cron schedule active: `SELECT * FROM cron.job` shows the schedule
- Test email delivered to a real inbox via Resend (smoke test)
