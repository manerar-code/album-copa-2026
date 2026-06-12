---
status: completed
title: "Fix save button visibility and functionality"
type: bugfix
complexity: low
dependencies: [task_04]
---

## Overview

The save button in the user name edit flow is positioned outside the visible screen area on smaller devices and does not consistently execute the save action. This task wraps the modal content with `KeyboardAvoidingView` to keep the button visible above the keyboard, and verifies the `onPress` binding is correct.

<critical>
- Read the PRD (BUG-03) and TechSpec (BUG-03 section) before starting.
- Complete task_04 first — same file, avoid merge conflicts.
- Do NOT change the save logic (`handleSaveNickname`) — only layout and button binding.
- Test on both small (iPhone SE) and large (iPhone 15 Pro Max) screen sizes conceptually.
- Tests are required as part of this task.
</critical>

<requirements>
1. The profile modal content MUST be wrapped with `KeyboardAvoidingView` using `behavior="padding"` on iOS and `behavior="height"` on Android.
2. The `editRow` container MUST use `flexShrink: 1` to prevent overflow.
3. The save button MUST be visible without scrolling when the keyboard is open.
4. The save button's `onPress` MUST call `handleSaveNickname` directly (no nested `TouchableOpacity` interception).
5. The save button MUST show `ActivityIndicator` while `saving === true` and be disabled during that state.
</requirements>

## Subtasks

- [x] Wrap the modal inner content with `KeyboardAvoidingView` in `RootNavigator.tsx` — already wrapped, only behavior prop needed update
- [x] Add `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` to `KeyboardAvoidingView`
- [x] Add `flexShrink: 1` to `editRow` style
- [x] Verify save button `onPress` is `handleSaveNickname` with no blocking parent `TouchableOpacity` — confirmed, binding is direct; overlay is sibling, not parent
- [x] Confirm `ActivityIndicator` renders when `saving === true` and button is disabled

## Implementation Details

- `src/core/navigation/RootNavigator.tsx` — modal content wrapper, `editRow` style, save button
- Import `KeyboardAvoidingView`, `Platform` from `react-native`
- See TechSpec "BUG-03" section for layout changes

### Relevant Files
- `src/core/navigation/RootNavigator.tsx` — only file to change

### Dependent Files
- `task_08` (album selector overlap) edits the same file — do after this task

## Deliverables

- Save button is visible above the keyboard on all screen sizes
- Tapping the save button reliably calls `handleSaveNickname`
- ActivityIndicator shows during save and button is non-interactive while saving

## Tests

### Unit Tests
- [x] Modal renders `KeyboardAvoidingView` as a wrapper — verified via `UNSAFE_getByType(KeyboardAvoidingView)` with behavior=`'padding'`
- [x] Save button `onPress` prop equals `handleSaveNickname` — verified pressing save calls `supabase.auth.updateUser`
- [x] Save button press is ignored while saving (disabled behavior) — verified via deferred promise, second press ignored
- [x] `ActivityIndicator` is rendered when `saving === true` — verified "Salvar" text disappears while saving

### Integration Tests
- [x] Opening the edit field and pressing Save triggers `handleSaveNickname` — verified `supabase.auth.updateUser` called with `{ data: { full_name: 'Test User' } }`
- [x] Save button is accessible (not clipped) when the component is rendered at 375px width — verified `editRow` has `width: '100%'` and `flexShrink: 1`

## Success Criteria

- All tests passing
- Test coverage >= 80% for the profile modal edit flow
- Save button visible and functional on web (Safari) and iOS
