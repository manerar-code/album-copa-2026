---
status: completed
title: "Clean up @app/* alias in metro.config.js and jest moduleNameMapper"
type: chore
complexity: low
dependencies: []
---

# Clean up @app/* alias in metro.config.js and jest moduleNameMapper


## Overview

The directory `src/app/` was renamed to `src/core/` in a previous session, and `metro.config.js` was updated with the `@core` alias. However, `package.json` jest `moduleNameMapper` still maps `@app/*` to `src/app/` (a non-existent directory). Any residual `@app/*` imports in tests will silently resolve to incorrect paths or fail. This task removes the stale `@app` jest mapper entry and scans for any residual `@app/*` imports in source files.

<critical>
- ALWAYS READ the PRD (F3.3) and TechSpec "Phase 3, step 22" before starting
- FOCUS ON "WHAT" — remove stale alias mapping and update any residual imports
- MINIMIZE CODE — one jest config change + grep for @app imports
- TESTS REQUIRED — verify test suite passes without @app resolution errors
</critical>

<requirements>
1. `package.json` jest `moduleNameMapper` MUST remove the `^@app/(.*)$` entry (or update it to point to `src/core/$1`).
2. All source files in `src/` MUST be scanned for `@app/*` imports.
3. Any found `@app/*` imports MUST be updated to `@core/*`.
4. `metro.config.js` does NOT need a `@app` alias (confirm it is absent).
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 18.1 Remove (or update) `^@app/(.*)$` entry from jest `moduleNameMapper` in `package.json`
- [ ] 18.2 Search all `src/**/*.{ts,tsx}` files for `@app/` imports
- [ ] 18.3 Update any found `@app/` imports to `@core/`
- [ ] 18.4 Verify `metro.config.js` does NOT have an `@app` alias entry
- [ ] 18.5 Run `npm test` to confirm no module resolution failures

## Implementation Details

`package.json` jest config section (moduleNameMapper). Grep for `@app/` across `src/`. See TechSpec "Phase 3, step 22".

### Relevant Files
- `package.json` — `jest.moduleNameMapper` section
- `metro.config.js` — verify `@app` alias is absent
- Any `src/**/*.ts(x)` files containing `@app/` imports

## Deliverables

- `package.json` with stale `@app` mapper removed/updated
- Zero `@app/` imports remaining in `src/`
- Test suite passes without module resolution errors

## Tests

### Unit Tests
- [ ] `package.json` jest `moduleNameMapper` does NOT map `@app/*` to `src/app/`
- [ ] `metro.config.js` does NOT contain `@app` key
- [ ] Grep of `src/**` returns zero `@app/` import matches

### Integration Tests
- [ ] `npm test` exits 0 with no "Cannot find module '@app/...'" errors

## Success Criteria

- All tests passing
- Zero @app/* import errors in test suite
- No stale alias pointing to non-existent directory
