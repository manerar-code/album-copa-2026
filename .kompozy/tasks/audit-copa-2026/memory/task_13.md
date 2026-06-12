# Task Memory: task_13.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Preencher todos os metadados obrigatórios no App Store Connect e Google Play Console para o app "Álbum Copa 2026", incluindo descrições, keywords, screenshots, URL de privacidade e Data Safety. Task manual (sem geração de código).

Status: in_progress — 13.1 concluído (metadados preparados), 13.5 URL verificada (HTTP 200), 13.2–13.4 aguardando execução manual.

## Important Decisions

- Metadados são inseridos manualmente nos consoles — `eas submit` só envia o binário
- Privacy Policy URL confirmada live: `https://album-copa-2026-sable.vercel.app/privacidade` (HTTP 200)
- Screenshots devem ser capturadas em simulador/emulador, não há automacão para isso
- Google Play Data Safety é formulário manual (não preenchível via EAS/CLI)
- Metadados salvos em `docs/store-metadata.txt` para copy-paste nos consoles

## Learnings

- Privacy Policy URL já estava no ar (task_06 concluída anteriormente)
- Não há dependências de código para esta task — todos os entregáveis estão nos consoles das lojas
- Tamanho da descrição: ~650 chars (bem abaixo do limite de 4000)

## Files / Surfaces

- `docs/store-metadata.txt` — arquivo de metadados criado (135 linhas, completo para copy-paste)
- `public/privacidade.html` — fonte da política de privacidade (já verificada live)
- App Store Connect (https://appstoreconnect.apple.com) — pendente (13.3)
- Google Play Console (https://play.google.com/console) — pendente (13.4)

## Errors / Corrections

- (none yet)

## Ready for Next Run

- Usuário precisa executar 13.2 (screenshots), 13.3 (App Store Connect), 13.4 (Google Play + Data Safety), 13.5 (verificar URL nos consoles)
- `docs/store-metadata.txt` contém todos os valores prontos para uso
