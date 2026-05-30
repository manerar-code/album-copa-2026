# Álbum Copa 2026 — Contexto do Projeto

## O que é
App mobile para colecionadores de figurinhas do álbum da Copa do Mundo 2026.
Sem login, sem backend de usuário — foco em simplicidade e velocidade offline.

## Stack
- React Native + Expo (SDK 56) + TypeScript strict
- Zustand (estado global)
- AsyncStorage (persistência local)
- Supabase (catálogo remoto: álbuns, seleções, figurinhas)
- React Navigation (Bottom Tabs + Stack)
- Jest + React Native Testing Library (testes)
- ESLint + Prettier + Husky (qualidade)

## Estrutura de Pastas
```
src/
├── app/           → navegação, providers, tema
├── modules/       → features (album, dashboard, search, missing, duplicates)
│   └── [feature]/
│       ├── components/
│       ├── screens/
│       ├── services/
│       ├── hooks/
│       ├── store/
│       ├── types/
│       └── tests/
├── shared/        → componentes, hooks, serviços, utils reutilizáveis
└── assets/
```

## Path Aliases
- `@app/*` → src/app/*
- `@modules/*` → src/modules/*
- `@shared/*` → src/shared/*
- `@assets/*` → src/assets/*

## Modelo de Dados
```ts
Album    { id, nome, versao }
Selecao  { id, album_id, nome, codigo_fifa, ordem, bandeira_url }
Figurinha{ id, album_id, selecao_id, numero, descricao, ordem }
StickerStatus = 'missing' | 'owned' | 'duplicate'
```

## Estado Local (AsyncStorage)
- Chave: `user_collection`
- Formato: `{ "001": "owned", "002": "missing", "003": "duplicate" }`
- Persistir imediatamente a cada alteração — NUNCA depender de botão salvar

## Fluxo de Estado de Figurinha
Missing → Owned → Duplicate → Missing (ciclo com 1 toque, sem popup)

## Design System
| Token        | Valor     |
|--------------|-----------|
| Primary      | #0A2342   |
| Secondary    | #2ECC71   |
| Accent       | #F1C40F   |
| Background   | #F8F9FA   |
| Missing cor  | #E8E8E8   |
| Owned cor    | #D5F5E3   |
| Duplicate cor| #FEF9E7   |

## Convenções de Nomenclatura
- Componentes: PascalCase `.tsx` (ex: StickerCard.tsx)
- Hooks: camelCase com `use` (ex: useSearch.ts)
- Stores: camelCase com `Store` (ex: albumStore.ts)
- Serviços: camelCase com `Service` (ex: catalogService.ts)

## Regras de Qualidade
- TypeScript strict — NUNCA usar `any`
- ESLint sem warnings ou errors
- Cobertura mínima: 80%
- Sem console.log em produção (usar logger.ts)
- Busca SEMPRE local, nunca consultar backend

## Navegação
Bottom Tabs: Home | Álbum | Faltantes | Repetidas
Stack: Álbum → TeamScreen

## Performance
- Inicialização: < 2 segundos
- Busca: < 100ms (debounce 300ms, indexação em memória)
- Mudança de estado: instantânea
- Scroll: 60 FPS
