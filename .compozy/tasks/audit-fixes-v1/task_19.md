---
status: completed
title: "Move babel-preset-expo to devDependencies"
type: chore
complexity: low
dependencies: []
---

# Move babel-preset-expo to devDependencies


## Overview

`babel-preset-expo` is a build-time tool that transforms code during bundling — it has no runtime presence and should not be in `dependencies`. Having it in `dependencies` causes it to be included when the package is installed as a library and slightly inflates the production dependency footprint. Moving it to `devDependencies` is a clean hygiene fix.

<critical>
- ALWAYS READ the PRD (F3.4) and TechSpec "Phase 3, step 23" before starting
- FOCUS ON "WHAT" — move one package entry between dependency sections
- MINIMIZE CODE — edit package.json only
- TESTS REQUIRED — verify build still works after move
</critical>

<requirements>
1. `babel-preset-expo` MUST be moved from `dependencies` to `devDependencies` in `package.json`.
2. The version specifier MUST remain identical after the move.
3. `npm install` MUST be run to update `package-lock.json`.
4. The EAS build MUST still succeed (babel preset is available at build time via devDependencies).
</requirements>

## Subtasks

- [ ] 19.1 Remove `babel-preset-expo` from `dependencies` in `package.json`
- [ ] 19.2 Add `babel-preset-expo` to `devDependencies` with the same version
- [ ] 19.3 Run `npm install` to update lock file
- [ ] 19.4 Verify `npm run web` still compiles (babel preset is loaded correctly)

## Implementation Details

Edit `package.json` only. Version specifier must not change.

### Relevant Files
- `package.json` — move entry between dependency sections

## Deliverables

- `package.json` with `babel-preset-expo` in `devDependencies`
- Updated `package-lock.json`
- Confirmed web build compiles after move

## Tests

### Unit Tests
- [ ] `package.json` `dependencies` does NOT contain `babel-preset-expo`
- [ ] `package.json` `devDependencies` DOES contain `babel-preset-expo`
- [ ] Version specifier is unchanged

### Integration Tests
- [ ] `npm run web` starts Metro bundler without Babel configuration errors

## Success Criteria

- All tests passing
- Web and EAS builds compile without Babel errors
- Production dependency footprint reduced
