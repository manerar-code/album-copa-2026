---
status: completed
title: resolveEntries utility
type: frontend
complexity: low
dependencies: []
---

# Task 01: resolveEntries utility

## Overview

Creates the pure `resolveEntries` function that converts a `ParsedEntry[]` from `parseTradeList` into an array of `figurinhaId` strings by matching entries against the catalog. This function is the resolution layer between raw text input and store operations — it is stateless, testable in isolation, and reused by the modal in Task 03.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "resolveEntries Logic" section for the lookup map approach
- FOCUS ON "WHAT" — a pure function that resolves ParsedEntry to figurinhaId, no side effects
- MINIMIZE CODE — no abstraction beyond the single exported function
- TESTS REQUIRED — this task's unit tests are the primary correctness guarantee for the entire feature
</critical>

<requirements>
- 1. MUST accept `(entries: ParsedEntry[], figurinhas: Figurinha[], selecoes: Selecao[])` and return `string[]`
- 2. MUST build O(1) lookup maps before iterating entries (not O(N²) nested loops)
- 3. MUST match `codigoFifa` case-insensitively
- 4. MUST match sticker numbers by numeric value (`parseInt`) to handle leading-zero variants
- 5. MUST skip silently any entry that cannot be resolved — no throw, no console output
- 6. MUST return an empty array when `entries` is empty
- 7. MUST NOT import from or depend on the Zustand store
</requirements>

## Subtasks

- [ ] 1.1 Create `src/modules/duplicates/utils/resolveEntries.ts` with the exported function
- [ ] 1.2 Build `selecaoByFifa` map (`codigoFifa.toUpperCase()` → `selecaoId`) inside the function
- [ ] 1.3 Build `figurinhaKey` map (`"${selecaoId}:${parseInt(numero)}"` → `figurinhaId`) inside the function
- [ ] 1.4 Iterate entries, resolve to IDs, skip unresolvable entries silently
- [ ] 1.5 Write unit tests in `src/tests/unit/resolveEntries.test.ts`

## Implementation Details

Create one new file. No existing files modified.

**New file:** `src/modules/duplicates/utils/resolveEntries.ts`

Import `ParsedEntry` from `src/modules/trades/utils/parseTradeList` (cross-module utility import, acceptable per TechSpec ADR-003). Import `Figurinha` and `Selecao` from `@shared/types`.

See TechSpec "resolveEntries Logic" section for the exact lookup map construction and matching strategy.

### Relevant Files

- `src/modules/trades/utils/parseTradeList.ts` — source of `ParsedEntry` type; import the interface from here
- `src/shared/types/index.ts` — `Figurinha` and `Selecao` type definitions
- `src/tests/unit/` — existing unit test folder; place `resolveEntries.test.ts` here

### Dependent Files

- `src/modules/duplicates/components/TradeRegistrationModal.tsx` — (Task 03) will import and call `resolveEntries`

### Related ADRs

- [ADR-003: TradeRegistrationModal co-located in duplicates/components](adrs/adr-003.md) — establishes that `resolveEntries` lives in `duplicates/utils/` despite importing from `trades/utils/`

## Deliverables

- `src/modules/duplicates/utils/resolveEntries.ts` — exported pure function
- `src/tests/unit/resolveEntries.test.ts` — unit tests with ≥80% coverage

## Tests

- Unit tests:
  - [ ] `resolveEntries` with two valid entries returns exactly those two figurinha IDs
  - [ ] Entry with unknown `codigoFifa` ("ZZZ") returns empty array, no throw
  - [ ] Entry with valid `codigoFifa` but unknown numero (9999) returns empty array, no throw
  - [ ] Entry with `numero: "01"` resolves to same sticker as `numero: "1"` (leading-zero parity)
  - [ ] Empty `entries` array returns `[]`
  - [ ] Duplicate entries in input return deduplicated IDs (one ID per unique sticker)
  - [ ] `figurinhas` from different selecoes do not cross-resolve (BRA:1 ≠ URU:1)
- Integration tests: N/A — pure function with no I/O
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `resolveEntries` is a pure function with no side effects, no store imports, no async
- TypeScript strict mode passes with no errors or `any`
