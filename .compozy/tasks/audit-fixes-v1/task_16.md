---
status: completed
title: "Apply __DEV__ guard to logger.warn and logger.error"
type: bugfix
complexity: low
dependencies: []
---

# Apply __DEV__ guard to logger.warn and logger.error


## Overview

`logger.ts` gates `logger.log` with `__DEV__` but calls `console.warn` and `console.error` unconditionally in production builds. This can expose PII (emails, tokens, stack traces) in system logs accessible via Xcode Instruments, adb logcat, or third-party crash reporting tools. This task applies the same `__DEV__` guard to both methods and replaces the direct `console.warn` call in `supabase.ts` with `logger.warn`.

<critical>
- ALWAYS READ the PRD (F3.1) and TechSpec ADR-005 before starting
- FOCUS ON "WHAT" — suppress warn/error in production; replace console.warn in supabase.ts
- MINIMIZE CODE — two one-line changes in logger.ts + one import/call change in supabase.ts
- TESTS REQUIRED — verify suppression in production and output in dev
</critical>

<requirements>
1. `logger.warn` MUST apply the same `if (isDev)` guard as `logger.log`.
2. `logger.error` MUST apply the same `if (isDev)` guard as `logger.log`.
3. Direct `console.warn` call in `src/shared/services/supabase.ts` MUST be replaced with `logger.warn`.
4. In development builds (`__DEV__ === true`), all three methods MUST still output to console.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 16.1 Add `if (isDev)` guard to `logger.warn` in `src/shared/utils/logger.ts`
- [ ] 16.2 Add `if (isDev)` guard to `logger.error` in `src/shared/utils/logger.ts`
- [ ] 16.3 Import `logger` in `src/shared/services/supabase.ts` (if not already imported)
- [ ] 16.4 Replace `console.warn(...)` call in `supabase.ts` with `logger.warn(...)`

## Implementation Details

Two files: `src/shared/utils/logger.ts` and `src/shared/services/supabase.ts`. See TechSpec ADR-005 for the exact guard pattern.

### Relevant Files
- `src/shared/utils/logger.ts` — add guard to warn and error
- `src/shared/services/supabase.ts` — replace console.warn with logger.warn

### Dependent Files
- All files that call `logger.warn` or `logger.error` — output now suppressed in production (expected behavior)

### Related ADRs
- [ADR-005: Logger Production Guard](adrs/adr-005.md) — Defines __DEV__ guard approach and Sentry deferral

## Deliverables

- `logger.ts` with production-safe warn and error
- `supabase.ts` using logger.warn
- Unit tests confirming suppression in production

## Tests

### Unit Tests
- [ ] `logger.warn('test')` with `__DEV__ = true`: calls `console.warn` with `'test'`
- [ ] `logger.warn('test')` with `__DEV__ = false`: does NOT call `console.warn`
- [ ] `logger.error('test')` with `__DEV__ = false`: does NOT call `console.error`
- [ ] `logger.log('test')` with `__DEV__ = false`: does NOT call `console.log` (regression — already works)
- [ ] `supabase.ts` does NOT contain `console.warn` (replaced by `logger.warn`)

### Integration Tests
- [ ] Production build (`NODE_ENV=production`): no `console.warn/error` output in Metro logs

## Success Criteria

- All tests passing
- No PII exposed via logger in production builds
- Development logging unchanged
