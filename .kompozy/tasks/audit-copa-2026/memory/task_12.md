# Task Memory: task_12.md

## Objective Snapshot
- Validate all 5 store assets (icon.png, android-icon-*, splash-icon.png) against required dimensions and alpha-channel spec
- Replace non-compliant assets with corrected versions

## Important Decisions
- Use raw PNG IHDR header parsing (with [int] cast to avoid PS byte overflow) for accurate pixel dimensions on Windows
- .NET System.Drawing.Image::FromFile may report DPI-adjusted dimensions; raw PNG header is the source of truth

## Learnings
- PowerShell 5.1 [byte] -shl overflows; always cast to [int] before shifting: `([int]$bytes[18] -shl 8)`

## Files / Surfaces
- assets/icon.png — 1024×1024, RGB (no alpha) ✓
- assets/android-icon-foreground.png — 432×432, RGBA ✓
- assets/android-icon-background.png — 432×432, RGBA ✓
- assets/android-icon-monochrome.png — 432×432, RGBA ✓
- assets/splash-icon.png — 1024×1024, Indexed color ✓

## Errors / Corrections
- None needed — all assets already compliant

## Ready for Next Run
- All 5 assets pass validation; no replacements required
