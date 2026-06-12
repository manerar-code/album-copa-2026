# Álbum Copa 2026 — Store Launch Readiness & Compliance — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | F1 — EAS secrets: remover credenciais do eas.json | completed | medium | — |
| 02 | F3 — Build config: deploymentTarget, minSdk, targetSdk | completed | low | — |
| 03 | F2 — RLS policies em user_collections e user_albums | completed | medium | task_01 |
| 04 | F6 — Login error feedback no LoginScreen | completed | low | — |
| 05 | F4a — PrivacyPolicyModal + link no LoginScreen | completed | low | task_04 |
| 06 | F4b — Página /privacidade estática no Vercel | completed | low | — |
| 07 | F5a — Migration: tabela account_deletion_requests | completed | medium | task_03 |
| 08 | F5b — accountDeletionService + authStore.pendingDeletion | completed | medium | task_07 |
| 09 | F5c — AccountDeletionModal + deletion UI no RootNavigator | completed | medium | task_08 |
| 10 | F5d — Edge Functions: emails de exclusão + cron diário | completed | high | task_07 |
| 11 | F7 — iOS Privacy Manifest no app.json | completed | low | task_02 |
| 12 | F8 — Validação e correção de assets | completed | low | — |
| 13 | F9 — Metadados das lojas (App Store + Google Play) | pending | low | task_06 |
| 14 | F11 — Extração do ProfileModal do RootNavigator | completed | medium | task_05, task_09 |
| 15 | F10 — React.memo em StickerCard e CromoCard | completed | low | task_14 |
| 16 | F12 — Decomposição do CatalogProvider em 4 hooks | completed | high | task_14 |
| 17 | F13 — Migração de @testing-library/jest-native | completed | low | task_16 |
