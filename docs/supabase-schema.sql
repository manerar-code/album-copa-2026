-- =============================================
-- Álbum Copa 2026 — Schema Supabase
-- Cole este script no SQL Editor do Supabase
-- =============================================

-- Tabela de Álbuns
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Seleções
CREATE TABLE selecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo_fifa TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  bandeira_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Figurinhas
CREATE TABLE figurinhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  selecao_id UUID NOT NULL REFERENCES selecoes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_selecoes_album_id ON selecoes(album_id);
CREATE INDEX idx_selecoes_ordem ON selecoes(album_id, ordem);
CREATE INDEX idx_figurinhas_album_id ON figurinhas(album_id);
CREATE INDEX idx_figurinhas_selecao_id ON figurinhas(selecao_id);
CREATE INDEX idx_figurinhas_ordem ON figurinhas(selecao_id, ordem);

-- Habilitar leitura pública (sem login)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE selecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE figurinhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de álbuns"
  ON albums FOR SELECT USING (true);

CREATE POLICY "Leitura pública de seleções"
  ON selecoes FOR SELECT USING (true);

CREATE POLICY "Leitura pública de figurinhas"
  ON figurinhas FOR SELECT USING (true);

-- =============================================
-- Dados iniciais de exemplo (Copa 2026)
-- =============================================

-- Inserir álbum
INSERT INTO albums (id, nome, versao)
VALUES ('00000000-0000-0000-0000-000000000001', 'Copa do Mundo 2026', 1);

-- Inserir seleções (exemplo com 6)
INSERT INTO selecoes (album_id, nome, codigo_fifa, ordem) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Brasil',    'BRA', 1),
  ('00000000-0000-0000-0000-000000000001', 'Argentina', 'ARG', 2),
  ('00000000-0000-0000-0000-000000000001', 'França',    'FRA', 3),
  ('00000000-0000-0000-0000-000000000001', 'Alemanha',  'GER', 4),
  ('00000000-0000-0000-0000-000000000001', 'Portugal',  'POR', 5),
  ('00000000-0000-0000-0000-000000000001', 'Espanha',   'ESP', 6);

-- Inserir figurinhas do Brasil (001-020)
INSERT INTO figurinhas (album_id, selecao_id, numero, descricao, ordem)
SELECT
  '00000000-0000-0000-0000-000000000001',
  s.id,
  LPAD(((s.ordem - 1) * 20 + n)::TEXT, 3, '0'),
  'Figurinha ' || LPAD(((s.ordem - 1) * 20 + n)::TEXT, 3, '0'),
  n
FROM selecoes s
CROSS JOIN generate_series(1, 20) AS n
WHERE s.album_id = '00000000-0000-0000-0000-000000000001';
