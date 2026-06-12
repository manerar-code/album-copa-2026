---
status: completed
title: "Fix ESLint lint script (remove deprecated --ext flag)"
type: chore
complexity: low
dependencies: []
---

# Fix ESLint lint script (remove deprecated --ext flag)


## Overview

The `lint` script in `package.json` uses the `--ext` flag which is not supported in ESLint v10 flat config (`eslint.config.js`). This causes the pre-commit hook to fail or produce incorrect results, allowing code quality issues to bypass CI. Removing `--ext` fixes the script so linting works correctly with the flat config already in place.

<critical>
- ALWAYS READ the PRD (F2.10) and TechSpec "Phase 2, step 9" before starting
- FOCUS ON "WHAT" — fix one script field in package.json
- MINIMIZE CODE — single string change
- TESTS REQUIRED — verify lint runs correctly after change
</critical>

<requirements>
1. The `lint` npm script MUST NOT include the `--ext` flag or any extension arguments.
2. The script MUST run `eslint src` (or equivalent) without extension filtering flags.
3. The existing `eslint.config.js` `files` glob already filters `.ts` and `.tsx` — no `--ext` needed.
4. Husky pre-commit hook behavior MUST be unchanged (still calls `npm run lint`).
</requirements>

## Subtasks

- [ ] 7.1 Read current `lint` script value in `package.json`
- [ ] 7.2 Remove `--ext .ts,.tsx` (or similar) from the script
- [ ] 7.3 Run `npm run lint` to confirm it executes without errors
- [ ] 7.4 Verify ESLint processes `src/` files correctly

## Implementation Details

Modify `package.json` scripts section only. See TechSpec "Phase 2, step 9" for context.

### Relevant Files
- `package.json` — `scripts.lint` field

### Dependent Files
- `.husky/pre-commit` — calls `npm run lint`; behavior unchanged

## Deliverables

- `package.json` with corrected `lint` script
- Confirmed `npm run lint` exits 0

## Tests

### Unit Tests
- [ ] `package.json` `scripts.lint` does NOT contain `--ext`
- [ ] `npm run lint` exits with code 0 on the current codebase

### Integration Tests
- [ ] Pre-commit hook runs `npm run lint` successfully when committing a `.ts` file

## Success Criteria

- All tests passing
- `npm run lint` runs without deprecated flag warnings
- Pre-commit hook does not fail on valid TypeScript files
