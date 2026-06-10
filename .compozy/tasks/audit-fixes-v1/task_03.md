---
status: completed
title: "Fix withFollyFix.js gsub idempotency"
type: bugfix
complexity: low
dependencies: []
---

# Fix withFollyFix.js gsub idempotency


## Overview

`plugins/withFollyFix.js` Fix B applies two sequential `gsub!` calls on Swift files: first replacing `weak let` → `weak var`, then `weak var` → `nonisolated(unsafe) weak var`. On a pre-patched source (incremental EAS rebuild), the second gsub matches the already-prefixed `nonisolated(unsafe) weak var` and produces `nonisolated(unsafe) nonisolated(unsafe) weak var`, causing a Swift compilation error and an invalid `.ipa`. This task makes Fix B atomic and idempotent.

<critical>
- ALWAYS READ the PRD (F1.6) and TechSpec "Key Decisions — withFollyFix idempotency" section before starting
- REFERENCE TECHSPEC for the exact regex replacement pattern
- FOCUS ON "WHAT" — replace two sequential gsubs with one atomic + guard
- MINIMIZE CODE — modify only the Fix B Ruby block inside the inject string
- TESTS REQUIRED — verify idempotency by simulating a second-run patch
</critical>

<requirements>
1. Fix B MUST replace both `gsub!` calls with a single atomic substitution: `gsub!(/\bweak let /, 'nonisolated(unsafe) weak var ')`.
2. A guard MUST skip files already containing `nonisolated(unsafe)`: `next if content.include?('nonisolated(unsafe)')`.
3. The fix MUST be idempotent: applying it twice to the same file MUST produce the same result as applying it once.
4. Fix A (folly/Portability.h patch) MUST remain unchanged.
5. The `FIX_MARKER` version check MUST remain (`# withFollyFix v4`) — do NOT increment the marker.
</requirements>

## Subtasks

- [x] 3.1 Locate the Fix B section in `plugins/withFollyFix.js` (the two `gsub!` lines)
- [x] 3.2 Replace the two sequential gsubs with one atomic regex substitution
- [x] 3.3 Add the `next if content.include?('nonisolated(unsafe)')` guard before the substitution
- [x] 3.4 Verify Fix A is unchanged
- [x] 3.5 Mentally simulate: apply to `weak let x` → `nonisolated(unsafe) weak var x`; apply again → skipped by guard

## Implementation Details

Modify only the Fix B Ruby block inside the `INJECT` string constant in `plugins/withFollyFix.js`. See TechSpec "Key Decisions — withFollyFix idempotency" for the exact replacement pattern.

### Relevant Files
- `plugins/withFollyFix.js` — Fix B section (the `jsi_sources.each` block)

### Dependent Files
- EAS iOS build process — this plugin patches Swift files during pod install

## Deliverables

- `plugins/withFollyFix.js` with idempotent Fix B
- Verification that the plugin correctly handles both first-run and re-run scenarios

## Tests

### Unit Tests
- [ ] Applying the new Fix B to a string containing `weak let x` produces `nonisolated(unsafe) weak var x`
- [ ] Applying the new Fix B twice to the same string produces the same result (idempotency check)
- [ ] A string containing `nonisolated(unsafe) weak var x` is skipped by the guard (no double prefix)
- [ ] A string containing only `weak var x` (no `weak let`) is also handled: `weak var` → not matched by `/\bweak let /` regex (correct — not transformed)
- [ ] Fix A section is unchanged (Portability.h guard still present)

### Integration Tests
- [ ] EAS iOS build Podfile output shows `[withFollyFix] expo-modules-jsi: patched N files` without Swift compilation errors

## Success Criteria

- All tests passing
- Fix B produces correct output on first run and is a no-op on second run
- EAS build does not fail with Swift `nonisolated` duplication error
