# Álbum Copa 2026 — Store Launch Readiness & Compliance — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | F1 — EAS secrets: remover credenciais do eas.json | completed | medium | — |
| 02 | F3 — Build config: deploymentTarget, minSdk, targetSdk | pending | low | — |
| 03 | F2 — RLS policies em user_collections e user_albums | pending | medium | task_01 |
| 04 | F6 — Login error feedback no LoginScreen | pending | low | — |
| 05 | F4a — PrivacyPolicyModal + link no LoginScreen | pending | low | task_04 |
| 06 | F4b — Página /privacidade estática no Vercel | pending | low | — |
| 07 | F5a — Migration: tabela account_deletion_requests | pending | medium | task_03 |
| 08 | F5b — accountDeletionService + authStore.pendingDeletion | pending | medium | task_07 |
| 09 | F5c — AccountDeletionModal + deletion UI no RootNavigator | pending | medium | task_08 |
| 10 | F5d — Edge Functions: emails de exclusão + cron diário | pending | high | task_07 |
| 11 | F7 — iOS Privacy Manifest no app.json | pending | low | task_02 |
| 12 | F8 — Validação e correção de assets | pending | low | — |
| 13 | F9 — Metadados das lojas (App Store + Google Play) | pending | low | task_06 |
| 14 | F11 — Extração do ProfileModal do RootNavigator | pending | medium | task_05, task_09 |
| 15 | F10 — React.memo em StickerCard e CromoCard | pending | low | task_14 |
| 16 | F12 — Decomposição do CatalogProvider em 4 hooks | pending | high | task_14 |
| 17 | F13 — Migração de @testing-library/jest-native | pending | low | task_16 |
