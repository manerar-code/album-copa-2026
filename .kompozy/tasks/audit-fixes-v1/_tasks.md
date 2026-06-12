# Audit Fixes v1 — Álbum Copa 2026 — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Remove react-native-worklets from package.json | completed | low | — |
| 02 | Switch EAS iOS Xcode image to stable (15.4) | completed | low | — |
| 03 | Fix withFollyFix.js gsub idempotency | completed | low | — |
| 04 | Install expo-splash-screen and configure App.tsx + app.json | completed | medium | task_01 |
| 05 | Add GestureHandlerRootView wrapper to App.tsx | completed | low | task_04 |
| 06 | Refactor CatalogProvider bootstrap with timeout + unified finally | completed | medium | — |
| 07 | Fix ESLint lint script (remove deprecated --ext flag) | completed | low | — |
| 08 | Fix toggleSticker stale rollback + add 300ms debounce | completed | medium | — |
| 09 | Add offline fallback to catalogService | completed | medium | — |
| 10 | Fix cloudCollectionService.replaceAll insert error propagation | completed | low | — |
| 11 | Fix syncService memory leak + isFlushing concurrency guard | completed | medium | — |
| 12 | Replace getSession with getUser in authService + 401 handling | completed | medium | — |
| 13 | Implement Sign in with Apple (expo-apple-authentication) | pending | high | task_12 |
| 14 | Add Android autoIncrement + secrets setup to eas.json | completed | low | — |
| 15 | Update LGPD/GDPR privacy policy content | pending | low | — |
| 16 | Apply __DEV__ guard to logger.warn and logger.error | completed | low | — |
| 17 | Add try/catch rollback to stickerStore.resetCollection | completed | low | — |
| 18 | Clean up @app/* alias in metro.config.js and jest moduleNameMapper | completed | low | — |
| 19 | Move babel-preset-expo to devDependencies | completed | low | — |
| 20 | Add typeof window guard to RootNavigator window references | completed | low | — |
| 21 | Create crossPlatformAlert helper + wrap StickerCard handlePress in useCallback | completed | low | — |
| 22 | Optimize AlbumListScreen FlatList with getItemLayout + useCallback | completed | medium | — |
| 23 | Apply Zustand field selectors in 5 store consumers | completed | medium | task_22 |
| 24 | Add accessibilityLabel + accessibilityRole to interactive elements | completed | medium | — |
| 25 | Add pre-init warning guard to offlineQueueService.enqueue | completed | low | — |
| 26 | Clean up app.json (remove experiments block, enable predictiveBack) | completed | low | — |
