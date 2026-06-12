---
status: completed
title: "Fix invisible text in TextInput fields"
type: bugfix
complexity: low
dependencies: []
---

## Overview

TextInput components in the profile modal and album rename flow do not specify an explicit `color` style. On web (Safari) and iOS dark mode, the default text color inherits from the OS/browser and matches the dark background, making typed text invisible. This task adds explicit `color` styles to all affected TextInputs.

<critical>
- Read the PRD (BUG-02) and TechSpec (BUG-02 section) before starting.
- Apply `color` to ALL TextInput components in affected files, not just the most visible one.
- Use the design system color token (`colors.text`) — do NOT hardcode `#FFFFFF`.
- Also add `placeholderTextColor` for placeholder visibility.
- Tests are required as part of this task.
</critical>

<requirements>
1. Every TextInput in `RootNavigator.tsx` MUST have an explicit `color: colors.text` style.
2. Every TextInput in `UserAlbumsModal.tsx` MUST have an explicit `color: colors.text` style.
3. `placeholderTextColor` MUST be set to a visible contrast color (e.g., `colors.textMuted` or `rgba(255,255,255,0.5)`).
4. No hardcoded hex color strings — use design system tokens.
5. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [x] Identify all TextInput components in `RootNavigator.tsx` and check for missing `color` style
- [x] Add `color: colors.primary` and `placeholderTextColor` to `nicknameInput` style (was already present as `colors.textPrimary`, changed to `colors.primary` for contrast)
- [x] Identify all TextInput components in `UserAlbumsModal.tsx` and check for missing `color` style
- [x] Add `color: colors.primary` and `placeholderTextColor` to the album rename TextInput style
- [x] Confirm `colors.text` token exists in the design system; if not, use `'#FFFFFF'` and note it — `colors.text` does NOT exist in the theme. Used `colors.primary` (#0C1322) for best contrast against the `colors.white` (#EEF2F8) card background. The theme has `colors.textPrimary` (#EEF2F8, same as card background), `colors.textSecondary` (#9AA6BE), and `colors.textMuted` (#646F88).

## Implementation Details

- `src/core/navigation/RootNavigator.tsx` — `nicknameInput` style (StyleSheet)
- `src/modules/auth/components/UserAlbumsModal.tsx` — album rename TextInput style
- Design system tokens are in `src/shared/theme/` or similar

### Relevant Files
- `src/core/navigation/RootNavigator.tsx` — profile modal TextInput
- `src/modules/auth/components/UserAlbumsModal.tsx` — album rename TextInput
- Design system / theme file for `colors` token

### Dependent Files
- `task_05` (album name pre-fill) edits `UserAlbumsModal.tsx` — do after this task
- `task_07` (save button fix) edits `RootNavigator.tsx` — do after this task

## Deliverables

- All TextInputs in affected files have explicit `color` and `placeholderTextColor` styles
- Typed text is visible in the profile name field and album rename field on web and iOS

## Tests

### Unit Tests
- [x] `nicknameInput` style in `RootNavigator.tsx` contains a `color` property — verified via RootNavigator test
- [x] Album rename TextInput in `UserAlbumsModal.tsx` contains a `color` property — verified via UserAlbumsModal test
- [x] `placeholderTextColor` prop is set on both TextInputs — verified via both tests

### Integration Tests
- [x] Profile modal TextInput renders with visible text against dark background — verified via component test (RootNavigator)
- [x] Album rename TextInput renders with visible text against dark background — verified via component test (UserAlbumsModal)

## Success Criteria

- All tests passing
- Test coverage >= 80% for affected components
- Typed text is visible in all input fields on the web app (Safari)
