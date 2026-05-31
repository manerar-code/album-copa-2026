# PRD — Álbum Copa 2026
**Versão 2.0 · Maio 2026**

---

## 1. Visão Geral

App mobile para colecionadores de figurinhas do álbum Panini da Copa do Mundo 2026. Permite controlar quais figurinhas o usuário possui, quais estão faltando e quais estão repetidas — com catálogo oficial completo.

**Stack:** React Native · Expo SDK 56 · TypeScript · Zustand · AsyncStorage · Supabase · React Navigation

---

## 2. O que foi construído (v1.0)

### Banco de Dados (Supabase)
- **1.195 figurinhas** reais do álbum Panini Copa 2026
- **52 seleções** com códigos FIFA reais
- 12 tipos de figurinha: `Player`, `foil`, `silver`, `McDonald's Exclusive`, `Extra/Base/Bronze/Silver/Gold`, `Coca Cola` (4 regiões)
- RLS configurado: SELECT público, INSERT/UPDATE/DELETE bloqueado para anon
- Paginação na busca (loop de 1000 em 1000) para trazer todas as 1.195 figurinhas

### Funcionalidades do App
| Feature | Status |
|---------|--------|
| Catálogo completo (52 seleções · 1.195 figurinhas) | ✅ |
| Marcar figurinha: Faltante → Tenho → Repetida (1 toque) | ✅ |
| Persistência local (AsyncStorage) | ✅ |
| Dashboard com progresso geral e por tipo | ✅ |
| Tela Faltantes com busca | ✅ |
| Tela Repetidas | ✅ |
| Busca expandida (número, nome, descrição, tipo, seleção) | ✅ |
| Filtro por tipo no Álbum (scroll horizontal) | ✅ |
| Barra de progresso por seleção | ✅ |
| Cache local do catálogo (offline-first) | ✅ |
| Build Android APK (EAS Build) | ✅ |

### Design System
| Token | Valor |
|-------|-------|
| Primary | `#0A2342` |
| Secondary | `#2ECC71` |
| Accent | `#F1C40F` |
| Background | `#F8F9FA` |
| Faltante | `#E8E8E8` |
| Tenho | `#D5F5E3` |
| Repetida | `#FEF9E7` |

---

## 3. Próxima versão — v2.0

### 3.1 Login com Google

**Por quê:** Permite salvar a coleção na nuvem e acessar de qualquer dispositivo.

**Como implementar:**
1. Instalar `expo-auth-session` + `expo-crypto`
2. Configurar OAuth Google no Supabase (Google Cloud Console → Client ID)
3. Criar tabela `user_collections` no Supabase
4. Na primeira vez: migrar AsyncStorage local → Supabase
5. Login opcional — app continua funcionando sem conta (modo offline)

**Fluxo de autenticação:**
```
Abrir app
  ├─ Sem conta → modo offline (comportamento atual)
  └─ Com conta Google
       ├─ Dados locais → sincroniza com Supabase
       └─ Dados na nuvem → carrega no dispositivo
```

**Tabela necessária:**
```sql
CREATE TABLE user_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  figurinha_id UUID REFERENCES figurinhas(id) ON DELETE CASCADE,
  status      TEXT CHECK (status IN ('owned', 'duplicate')),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, figurinha_id)
);
-- RLS: usuário só vê/edita seus próprios dados
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON user_collections
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Esforço estimado:** 2–3 sessões

---

### 3.2 Salvar coleção na nuvem

**Por quê:** Hoje a coleção fica só no dispositivo — se trocar de celular, perde tudo.

**Como implementar:**
- Depende do login Google (3.1)
- Sincronização automática: cada toque em figurinha → `upsert` no Supabase
- Merge inteligente na abertura: local vs. nuvem → ganha o mais recente por `updated_at`
- Indicador de sync na UI (ícone de nuvem no header)

**Esforço estimado:** 1 sessão após login pronto

---

## 4. Features adicionais sugeridas (simples e valiosas)

### 🔴 Alta prioridade

| Feature | Descrição | Esforço |
|---------|-----------|---------|
| **Troca de figurinhas** | Lista de repetidas formatada para compartilhar via WhatsApp ("Tenho para trocar: BRA3, ARG7...") | Pequeno |
| **Estatísticas detalhadas** | % por seleção, % por tipo, gráfico de progresso ao longo do tempo | Médio |
| **Modo compra** | Calcula quantas figurinhas faltam e estima custo (pacotes de 5) | Pequeno |

### 🟡 Médio prazo

| Feature | Descrição | Esforço |
|---------|-----------|---------|
| **Scanner de figurinha** | Câmera lê o número e marca automaticamente | Médio |
| **Ranking entre amigos** | Compara % de conclusão com outros usuários logados | Médio |
| **Notificações** | Lembrete semanal "você completou X% esta semana!" | Pequeno |
| **Tema escuro** | Dark mode com as cores do álbum | Pequeno |
| **Widget iOS/Android** | Progresso geral na tela inicial do celular | Grande |

### 🟢 Baixo esforço / alto impacto imediato

| Feature | Descrição | Esforço |
|---------|-----------|---------|
| **Compartilhar progresso** | Print estilizado do progresso para postar no Instagram | Pequeno |
| **Figurinhas brilhosas** | Filtro especial só para figurinhas `foil` e `silver` | Mínimo |
| **Busca global melhorada** | Buscar em qualquer tela (toque no ícone lupa no tab bar) | Pequeno |
| **Onboarding** | Tutorial de 3 telas na primeira abertura explicando os gestos | Pequeno |

---

## 5. Arquitetura v2.0

```
┌─────────────────────────────────────────────┐
│                   App                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │ Catalog  │  │Collection │  │
│  │  Google  │  │ Supabase │  │Local+Cloud│  │
│  └──────────┘  └──────────┘  └───────────┘  │
│         ↓             ↓            ↓         │
│  ┌──────────────────────────────────────┐    │
│  │         Zustand (estado global)      │    │
│  └──────────────────────────────────────┘    │
│         ↓                          ↓         │
│  AsyncStorage                  Supabase      │
│  (offline fallback)         (fonte da verdade│
│                              quando logado)  │
└─────────────────────────────────────────────┘
```

### Novas tabelas Supabase

```sql
-- Coleção do usuário (v2.0)
user_collections (user_id, figurinha_id, status, updated_at)

-- Perfil do usuário (opcional v2.0)
profiles (id, display_name, avatar_url, created_at)
```

---

## 6. Configuração do projeto

### Como rodar (web)
```powershell
"C:\Program Files\nodejs\npm.cmd" run web --prefix "C:\Users\RobertoManera\OneDrive - Kbase\ProjetosClaude\AppAlbum\album-copa-2026"
# Abre em http://localhost:8081
```

### EAS Build
```powershell
cd "C:\Users\RobertoManera\OneDrive - Kbase\ProjetosClaude\AppAlbum\album-copa-2026"

# Android APK
eas build --platform android --profile preview --non-interactive

# iOS IPA (requer Apple Developer)
eas build --platform ios --profile preview --non-interactive
```

### IDs do projeto
- **EAS Project ID:** `758486d3-d924-4d75-b91a-a32c41f7ae0b`
- **EAS Owner:** `manerar`
- **Android package:** `com.manera.albumcopa2026`
- **iOS bundle ID:** `com.manera.albumcopa2026`
- **Expo:** https://expo.dev/accounts/manerar/projects/album-copa-2026

---

## 7. Decisões técnicas tomadas

| Decisão | Motivo |
|---------|--------|
| `react-native-reanimated@3.x` (não v4) | v4 requer `react-native-worklets` que bloqueia Expo Go |
| `.npmrc` com `legacy-peer-deps=true` | `eslint-plugin-react` não suporta `eslint@10.x` |
| `"prepare": "husky \|\| true"` | Husky quebra no CI do EAS Build |
| Paginação no `getStickers` | Supabase limita 1000 linhas por query |
| Filtros com `ScrollView` horizontal | Muitos tipos de figurinha — `flexWrap` ficava feio |
| Coleção offline-first | App funciona sem internet após primeiro carregamento |
