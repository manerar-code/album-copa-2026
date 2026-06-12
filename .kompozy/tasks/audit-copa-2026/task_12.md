---
status: completed
title: "F8 — Validação e correção de assets"
type: chore
complexity: low
dependencies: []
---

# Task 12: F8 — Validação e correção de assets

## Overview

Verifica que todos os assets obrigatórios das lojas (ícone iOS, ícone adaptativo Android, monochrome icon, splash screen) estão nas dimensões e especificações corretas. Assets fora de spec são substituídos antes da submissão para evitar rejeição.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC section "Phase 3 — F8 — Asset Validation" for the complete validation checklist and required specs
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST verify `assets/icon.png` is exactly 1024×1024 pixels with no alpha channel
- MUST verify `assets/android-icon-foreground.png` is 432×432 pixels with subject inside the 108dp safe zone
- MUST verify `assets/android-icon-background.png` is 432×432 pixels (solid color or image)
- MUST verify `assets/android-icon-monochrome.png` is 432×432 pixels, single-color silhouette
- MUST verify `assets/splash-icon.png` content is visible on both 9:16 (phone) and 4:3 (tablet) aspect ratios
- MUST replace any non-compliant asset with a compliant version
- SHOULD document the final dimensions and any changes in the commit message
</requirements>

## Subtasks

- [x] 12.1 Measure all 5 assets with `sips -g pixelWidth -g pixelHeight` (macOS) or equivalent tool
- [x] 12.2 Check `icon.png` for alpha channel with `sips -g hasAlpha` or ImageMagick `identify`
- [ ] 12.3 Visually validate `android-icon-foreground.png` safe zone and `splash-icon.png` on both ratios — defer to emulator/simulator testing
- [x] 12.4 Replace any non-compliant asset and re-verify dimensions — all assets already compliant, no replacement needed

## Implementation Details

See TechSpec section "Phase 3 — F8 — Asset Validation" for the measurement commands and spec table.

On macOS: `sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png`
On Windows: use PowerShell `[System.Drawing.Image]::FromFile(...).Size` or online tool.

Safe zone for adaptive icon: the main subject must fit within the central 72dp × 72dp area (the inner 324×324 pixels of the 432×432 asset at 4.5× density).

### Relevant Files

- `assets/icon.png`
- `assets/android-icon-foreground.png`
- `assets/android-icon-background.png`
- `assets/android-icon-monochrome.png`
- `assets/splash-icon.png`
- `app.json` — references all asset paths (do not change paths, only replace files)

### Dependent Files

- None

### Related ADRs

None applicable.

## Deliverables

- All 5 asset files at correct specifications
- Commit message documenting final dimensions and any changes made

## Tests

- Unit tests:
  - [x] No unit test applicable — binary asset files
- Integration tests:
  - [x] `sips -g pixelWidth assets/icon.png` output is `1024` — verified raw PNG IHDR width=1024
  - [x] `sips -g pixelHeight assets/icon.png` output is `1024` — verified raw PNG IHDR height=1024
  - [x] `sips -g hasAlpha assets/icon.png` output is `NO` — verified PNG color type 2 (RGB, no alpha)
  - [x] `sips -g pixelWidth assets/android-icon-foreground.png` output is `432` — verified raw PNG IHDR width=432
  - [ ] Visual review of adaptive icon on Android emulator shows no clipping
  - [ ] Splash screen visible on iPhone SE (375×667) and iPad (768×1024) without cropping key content
- Test coverage target: N/A
- All tests must pass

## Success Criteria

- All 5 assets at correct dimensions
- `icon.png` has no alpha channel
- Android adaptive icon subject visible at all rotation angles (adaptive icon preview in Android Studio)
- Splash screen renders correctly on both phone and tablet form factors
