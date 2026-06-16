---
status: completed
title: "Remove selecoes parameter from parseTradeList"
type: refactor
complexity: low
dependencies: []
---

## Overview

`parseTradeList(text, selecoes)` carries an unused `selecoes: Selecao[]` parameter — the body immediately executes `void selecoes;`. This task removes the dead parameter from the function signature and updates all 37 unit test call sites mechanically. No logic changes occur; `ParseResult` output is identical before and after.

<critical>
- Read the TechSpec "Component Changes — parseTradeList.ts" and ADR-003 before starting.
- Do NOT change any parsing logic, regex, or deduplication behavior.
- Do NOT change any test assertions — only remove the second argument from call sites.
- Tests are required: all 37 existing tests must pass after the change.
</critical>

<requirements>
1. `parseTradeList` MUST have the signature `parseTradeList(text: string): ParseResult` after this task.
2. The `void selecoes;` line MUST be removed.
3. The `import type { Selecao }` in `parseTradeList.ts` MUST be removed if it is no longer referenced.
4. All 37 `parseTradeList(text, selecoes)` call sites in `parseTradeList.test.ts` MUST be updated to `parseTradeList(text)`.
5. No test assertions or describe blocks MAY be added, removed, or modified — only call site arguments.
6. TypeScript strict — no new `any` introduced.
</requirements>

## Subtasks

- [x] Remove `selecoes: Selecao[]` parameter and `void selecoes;` line from `parseTradeList.ts`
- [x] Remove `import type { Selecao }` from `parseTradeList.ts` (verify it has no other uses in the file)
- [x] Update all 23 call sites in `parseTradeList.test.ts` — remove the second argument
- [x] Run `npx jest parseTradeList --no-coverage` and confirm 23 tests pass

## Implementation Details

- Modify `src/modules/trades/utils/parseTradeList.ts` — signature change only
- Modify `src/tests/unit/parseTradeList.test.ts` — remove second argument from every call site

See TechSpec "Component Changes — parseTradeList.ts" and "ADR-003" sections.

### Relevant Files
- `src/modules/trades/utils/parseTradeList.ts` — function to update
- `src/tests/unit/parseTradeList.test.ts` — 37 test call sites to update

### Dependent Files
- `src/modules/trades/screens/TradesScreen.tsx` — calls `parseTradeList`; will be updated in task_02

### Related ADRs
- [ADR-003: Remove selecoes Parameter from parseTradeList](adrs/adr-003.md)

## Deliverables

- `parseTradeList.ts` with clean signature `(text: string): ParseResult`
- `parseTradeList.test.ts` with all 37 call sites using single-argument form
- All 37 unit tests passing

## Tests

### Unit Tests
- [ ] `parseTradeList('URU01 URU2')` returns 2 entries with `hasNoPrefix: false`
- [ ] `parseTradeList('uru: 1, 2')` returns 2 entries with `codigoFifa: 'URU'`
- [ ] `parseTradeList('1;2;10')` returns `hasNoPrefix: true`, `entries: []`
- [ ] `parseTradeList('')` returns `entries: []`, `hasNoPrefix: false`, `unresolvableCount: 0`
- [ ] `parseTradeList('FWC6 (x1)')` returns `[{FWC, 6}]`
- [ ] `parseTradeList('XYZ01')` returns `entries: [{XYZ, 1}]`, `unresolvableCount: 0`
- [ ] All remaining 31 existing test cases pass unchanged

### Integration Tests
- [ ] N/A — `parseTradeList` is a pure utility function; integration is covered in task_02

## Success Criteria

- All 37 unit tests passing after argument removal
- TypeScript compilation passes with no new errors
- `parseTradeList.ts` contains no reference to `Selecao` type
