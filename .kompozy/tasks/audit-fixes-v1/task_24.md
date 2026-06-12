---
status: completed
title: "Add accessibilityLabel + accessibilityRole to interactive elements"
type: bugfix
complexity: medium
dependencies: []
---

# Add accessibilityLabel + accessibilityRole to interactive elements


## Overview

Several interactive elements across the app lack `accessibilityLabel` and `accessibilityRole` props, making them unidentifiable to screen readers (VoiceOver on iOS, TalkBack on Android). Affected elements include sticker card buttons in `CromoCard`, the profile avatar in `RootNavigator`, type chip buttons, and edit/delete icons in `UserAlbumsModal`. This task adds the minimum required accessibility attributes to all tappable elements.

<critical>
- ALWAYS READ the PRD (F3.9) and TechSpec "Phase 3, step 28" before starting
- FOCUS ON "WHAT" — add accessibilityLabel and accessibilityRole to tappable elements
- MINIMIZE CODE — prop additions only; no structural changes
- TESTS REQUIRED — verify labels are present and correct
</critical>

<requirements>
1. Every `TouchableOpacity` and `Pressable` used as a button MUST have `accessibilityRole="button"`.
2. Every interactive element MUST have a descriptive `accessibilityLabel` in Portuguese (matching the app language).
3. `CromoCard` touchable wrapper MUST have `accessibilityLabel` describing the sticker number and current status.
4. Profile avatar button in `RootNavigator` MUST have `accessibilityLabel="Perfil do usuário"`.
5. Edit/delete icon buttons in `UserAlbumsModal` MUST have `accessibilityLabel="Editar álbum"` / `"Excluir álbum"`.
6. Type chip buttons in `TypeSettingsModal` MUST have descriptive labels.
7. TypeScript strict — no `any` introduced.
</requirements>

## Subtasks

- [ ] 24.1 Add `accessibilityRole="button"` and `accessibilityLabel` to `CromoCard` touchable wrapper
- [ ] 24.2 Add `accessibilityRole="button"` and `accessibilityLabel="Perfil do usuário"` to profile avatar in `RootNavigator`
- [ ] 24.3 Add `accessibilityRole="button"` and `accessibilityLabel` to edit/delete buttons in `UserAlbumsModal`
- [ ] 24.4 Add `accessibilityRole="button"` and `accessibilityLabel` to type chips in `TypeSettingsModal`
- [ ] 24.5 Scan remaining interactive elements in `AlbumListScreen` row items and add labels

## Implementation Details

Four files minimum: `CromoCard.tsx`, `RootNavigator.tsx`, `UserAlbumsModal.tsx`, `TypeSettingsModal.tsx`. See TechSpec "Phase 3, step 28" and PRD F3.9.

### Relevant Files
- `src/shared/components/CromoCard.tsx` — touchable wrapper
- `src/core/navigation/RootNavigator.tsx` — profile avatar button
- `src/modules/auth/components/UserAlbumsModal.tsx` — edit/delete icon buttons
- `src/modules/auth/components/TypeSettingsModal.tsx` — type chip buttons
- `src/modules/album/screens/AlbumListScreen.tsx` — team row items

## Deliverables

- All interactive elements in affected files have accessibilityLabel + accessibilityRole
- VoiceOver test confirmation on iOS

## Tests

### Unit Tests
- [ ] `CromoCard` with `state="owned"` and `numero="10"`: accessibilityLabel contains "10" and "Tenho"
- [ ] `CromoCard` with `state="missing"`: accessibilityLabel contains "Faltando"
- [ ] Profile avatar in `RootNavigator`: accessibilityLabel equals "Perfil do usuário"
- [ ] Delete button in `UserAlbumsModal`: accessibilityLabel equals "Excluir álbum"
- [ ] Edit button in `UserAlbumsModal`: accessibilityLabel equals "Editar álbum"

### Integration Tests
- [ ] (Manual — iPhone) VoiceOver reads correct label when focusing on sticker card
- [ ] (Manual — iPhone) VoiceOver reads "Perfil do usuário" when focusing on profile button

## Success Criteria

- All tests passing
- Test coverage >= 80% for accessibility label presence
- All interactive elements pass VoiceOver audit on iOS
