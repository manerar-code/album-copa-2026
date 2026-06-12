# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State
- task_05 (F4a) completed: PrivacyPolicyModal + link in LoginScreen implemented
- task_06 (F4b) completed: /privacidade static page deployed and verified live at `album-copa-2026-sable.vercel.app/privacidade`
- task_07 (F5a) completed: migration file created; apply via SQL Editor
- task_08 (F5b) completed: accountDeletionService + authStore.pendingDeletion
- task_09 (F5c) completed: AccountDeletionModal + deletion UI in RootNavigator
- task_10 (F5d) completed: send-deletion-confirmation + process-pending-deletions Edge Functions; pg_cron migration; 14 unit tests passing
- task_11 (F7) completed: iOS Privacy Manifest added to app.json
- task_12 (F8) completed: all 5 assets validated at correct specs — no replacements needed
- task_17 (F13) completed: `@testing-library/jest-native` removed from devDependencies and setupFilesAfterEnv
- Next pending: task_13 (F9 - Store Metadata)

## Shared Decisions
- Edge Function pattern for testability: use `handler.ts` (pure logic with injected dependencies, testable in Jest) + `index.ts` (Deno.serve wrapper with `npm:` imports for deployment). Keeps Deno-specific imports out of testable code.
- For complex Supabase Edge Functions, use a `DataAccess` interface abstraction (e.g., `DeletionDataAccess`) instead of raw chained queries — enables clean `jest.fn()` mocking in tests.

## Shared Learnings
- `SafeAreaView` from react-native is deprecated — use `react-native-safe-area-context` for future modal components (affects task_14 ProfileModal extraction)
- Supabase CLI requires `SUPABASE_ACCESS_TOKEN` env var for non-TTY usage — migration SQL must be applied manually via Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/fmsojsxadjdigwppqnfa/sql/new)
- EAS CLI v20.1.0 has no `--dry-run` flag for `eas build`; use `npx expo config --type public` to verify Expo-managed configs locally
- PowerShell 5.1 `[byte]` values overflow on `-shl`; always cast to `[int]` before bit-shifting byte values: `([int]$byte -shl 8)`

## Open Risks

## Handoffs
