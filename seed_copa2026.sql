-- ============================================================
-- SEED: Álbum Copa do Mundo FIFA 2026
-- ============================================================
-- Execute no SQL Editor do Supabase (Database > SQL Editor)
--
-- Estrutura:
--   Abertura  (ABT) ..........  10 figurinhas  (nº 1–10)
--   Sedes     (SED) ..........  16 figurinhas  (nº 1–16)
--   48 Seleções — Grupos A–P ..  20 figurinhas cada (nº 1–20)
--
-- Total: 10 + 16 + (48 × 20) = 986 figurinhas
--
-- Obs.: IDs usam texto legível ('copa2026', 'sel-bra', etc.).
--   Se a coluna id for do tipo uuid, converta-a primeiro:
--   ALTER TABLE albums     ALTER COLUMN id TYPE text;
--   ALTER TABLE selecoes   ALTER COLUMN id TYPE text;
--   ALTER TABLE figurinhas ALTER COLUMN id TYPE text;
--
-- Grupos baseados no sorteio real de dez/2024 — ajuste se
-- necessário após confirmação oficial das classificações.
-- ============================================================

BEGIN;

-- ── ÁLBUM ────────────────────────────────────────────────────

INSERT INTO albums (id, nome, versao) VALUES
  ('copa2026', 'Copa do Mundo FIFA 2026', 1)
ON CONFLICT (id) DO NOTHING;

-- ── SEÇÕES DO ÁLBUM ──────────────────────────────────────────
-- "ordem" define a sequência das páginas no álbum.
-- Páginas especiais (ABT, SED) vêm antes das seleções.
-- Dentro de cada grupo os times seguem a semeação.

INSERT INTO selecoes (id, album_id, nome, codigo_fifa, ordem, bandeira_url) VALUES

-- Páginas especiais (não são seleções)
  ('sel-abt', 'copa2026', 'Abertura',          'ABT',  1, ''),
  ('sel-sed', 'copa2026', 'Sedes',             'SED',  2, ''),

-- ── GRUPO A ──────────────────────────────────────────────────
  ('sel-mex', 'copa2026', 'México',            'MEX', 10, 'https://flagcdn.com/w80/mx.png'),
  ('sel-ven', 'copa2026', 'Venezuela',         'VEN', 11, 'https://flagcdn.com/w80/ve.png'),
  ('sel-nzl', 'copa2026', 'Nova Zelândia',     'NZL', 12, 'https://flagcdn.com/w80/nz.png'),

-- ── GRUPO B ──────────────────────────────────────────────────
  ('sel-usa', 'copa2026', 'Estados Unidos',    'USA', 13, 'https://flagcdn.com/w80/us.png'),
  ('sel-pan', 'copa2026', 'Panamá',            'PAN', 14, 'https://flagcdn.com/w80/pa.png'),
  ('sel-jor', 'copa2026', 'Jordânia',          'JOR', 15, 'https://flagcdn.com/w80/jo.png'),

-- ── GRUPO C ──────────────────────────────────────────────────
  ('sel-can', 'copa2026', 'Canadá',            'CAN', 16, 'https://flagcdn.com/w80/ca.png'),
  ('sel-mar', 'copa2026', 'Marrocos',          'MAR', 17, 'https://flagcdn.com/w80/ma.png'),
  ('sel-hrv', 'copa2026', 'Croácia',           'HRV', 18, 'https://flagcdn.com/w80/hr.png'),

-- ── GRUPO D ──────────────────────────────────────────────────
  ('sel-arg', 'copa2026', 'Argentina',         'ARG', 19, 'https://flagcdn.com/w80/ar.png'),
  ('sel-pol', 'copa2026', 'Polônia',           'POL', 20, 'https://flagcdn.com/w80/pl.png'),
  ('sel-zaf', 'copa2026', 'África do Sul',     'ZAF', 21, 'https://flagcdn.com/w80/za.png'),

-- ── GRUPO E ──────────────────────────────────────────────────
  ('sel-esp', 'copa2026', 'Espanha',           'ESP', 22, 'https://flagcdn.com/w80/es.png'),
  ('sel-srb', 'copa2026', 'Sérvia',            'SRB', 23, 'https://flagcdn.com/w80/rs.png'),
  ('sel-jpn', 'copa2026', 'Japão',             'JPN', 24, 'https://flagcdn.com/w80/jp.png'),

-- ── GRUPO F ──────────────────────────────────────────────────
  ('sel-fra', 'copa2026', 'França',            'FRA', 25, 'https://flagcdn.com/w80/fr.png'),
  ('sel-uru', 'copa2026', 'Uruguai',           'URU', 26, 'https://flagcdn.com/w80/uy.png'),
  ('sel-kor', 'copa2026', 'Coreia do Sul',     'KOR', 27, 'https://flagcdn.com/w80/kr.png'),

-- ── GRUPO G ──────────────────────────────────────────────────
  ('sel-por', 'copa2026', 'Portugal',          'POR', 28, 'https://flagcdn.com/w80/pt.png'),
  ('sel-cmr', 'copa2026', 'Camarões',          'CMR', 29, 'https://flagcdn.com/w80/cm.png'),
  ('sel-qat', 'copa2026', 'Catar',             'QAT', 30, 'https://flagcdn.com/w80/qa.png'),

-- ── GRUPO H ──────────────────────────────────────────────────
  ('sel-eng', 'copa2026', 'Inglaterra',        'ENG', 31, 'https://flagcdn.com/w80/gb-eng.png'),
  ('sel-nga', 'copa2026', 'Nigéria',           'NGA', 32, 'https://flagcdn.com/w80/ng.png'),
  ('sel-ecu', 'copa2026', 'Equador',           'ECU', 33, 'https://flagcdn.com/w80/ec.png'),

-- ── GRUPO I ──────────────────────────────────────────────────
  ('sel-ned', 'copa2026', 'Países Baixos',     'NED', 34, 'https://flagcdn.com/w80/nl.png'),
  ('sel-sen', 'copa2026', 'Senegal',           'SEN', 35, 'https://flagcdn.com/w80/sn.png'),
  ('sel-aus', 'copa2026', 'Austrália',         'AUS', 36, 'https://flagcdn.com/w80/au.png'),

-- ── GRUPO J ──────────────────────────────────────────────────
  ('sel-deu', 'copa2026', 'Alemanha',          'DEU', 37, 'https://flagcdn.com/w80/de.png'),
  ('sel-col', 'copa2026', 'Colômbia',          'COL', 38, 'https://flagcdn.com/w80/co.png'),
  ('sel-sau', 'copa2026', 'Arábia Saudita',    'SAU', 39, 'https://flagcdn.com/w80/sa.png'),

-- ── GRUPO K ──────────────────────────────────────────────────
  ('sel-bel', 'copa2026', 'Bélgica',           'BEL', 40, 'https://flagcdn.com/w80/be.png'),
  ('sel-dza', 'copa2026', 'Argélia',           'DZA', 41, 'https://flagcdn.com/w80/dz.png'),
  ('sel-uzb', 'copa2026', 'Uzbequistão',       'UZB', 42, 'https://flagcdn.com/w80/uz.png'),

-- ── GRUPO L ──────────────────────────────────────────────────
  ('sel-ita', 'copa2026', 'Itália',            'ITA', 43, 'https://flagcdn.com/w80/it.png'),
  ('sel-egy', 'copa2026', 'Egito',             'EGY', 44, 'https://flagcdn.com/w80/eg.png'),
  ('sel-crc', 'copa2026', 'Costa Rica',        'CRC', 45, 'https://flagcdn.com/w80/cr.png'),

-- ── GRUPO M ──────────────────────────────────────────────────
  ('sel-bra', 'copa2026', 'Brasil',            'BRA', 46, 'https://flagcdn.com/w80/br.png'),
  ('sel-gha', 'copa2026', 'Gana',              'GHA', 47, 'https://flagcdn.com/w80/gh.png'),
  ('sel-hnd', 'copa2026', 'Honduras',          'HND', 48, 'https://flagcdn.com/w80/hn.png'),

-- ── GRUPO N ──────────────────────────────────────────────────
  ('sel-che', 'copa2026', 'Suíça',             'CHE', 49, 'https://flagcdn.com/w80/ch.png'),
  ('sel-civ', 'copa2026', 'Costa do Marfim',   'CIV', 50, 'https://flagcdn.com/w80/ci.png'),
  ('sel-irn', 'copa2026', 'Irã',               'IRN', 51, 'https://flagcdn.com/w80/ir.png'),

-- ── GRUPO O ──────────────────────────────────────────────────
  ('sel-aut', 'copa2026', 'Áustria',           'AUT', 52, 'https://flagcdn.com/w80/at.png'),
  ('sel-idn', 'copa2026', 'Indonésia',         'IDN', 53, 'https://flagcdn.com/w80/id.png'),
  ('sel-mli', 'copa2026', 'Mali',              'MLI', 54, 'https://flagcdn.com/w80/ml.png'),

-- ── GRUPO P ──────────────────────────────────────────────────
  ('sel-den', 'copa2026', 'Dinamarca',         'DEN', 55, 'https://flagcdn.com/w80/dk.png'),
  ('sel-sco', 'copa2026', 'Escócia',           'SCO', 56, 'https://flagcdn.com/w80/gb-sct.png'),
  ('sel-tur', 'copa2026', 'Turquia',           'TUR', 57, 'https://flagcdn.com/w80/tr.png')

ON CONFLICT (id) DO NOTHING;

-- ── FIGURINHAS: ABERTURA (nº 1–10) ──────────────────────────

INSERT INTO figurinhas (id, album_id, selecao_id, numero, nome, descricao, ordem) VALUES
  ('fig-abt-01', 'copa2026', 'sel-abt', '1',  'Capa do Álbum',                   'Abertura',        1),
  ('fig-abt-02', 'copa2026', 'sel-abt', '2',  'Troféu FIFA',                     'Troféu',          2),
  ('fig-abt-03', 'copa2026', 'sel-abt', '3',  'Mascote Oficial',                 'Mascote',         3),
  ('fig-abt-04', 'copa2026', 'sel-abt', '4',  'Bola Oficial adidas',             'Bola Oficial',    4),
  ('fig-abt-05', 'copa2026', 'sel-abt', '5',  'Países Anfitriões',               'Apresentação',    5),
  ('fig-abt-06', 'copa2026', 'sel-abt', '6',  'Sede — EUA',                      'Apresentação',    6),
  ('fig-abt-07', 'copa2026', 'sel-abt', '7',  'Sede — Canadá',                   'Apresentação',    7),
  ('fig-abt-08', 'copa2026', 'sel-abt', '8',  'Sede — México',                   'Apresentação',    8),
  ('fig-abt-09', 'copa2026', 'sel-abt', '9',  'Maiores Campeões',                'História',        9),
  ('fig-abt-10', 'copa2026', 'sel-abt', '10', 'Galeria de Lendas',               'História',       10)
ON CONFLICT (id) DO NOTHING;

-- ── FIGURINHAS: SEDES (nº 1–16) ─────────────────────────────
-- 11 estádios EUA + 2 Canadá + 3 México = 16

INSERT INTO figurinhas (id, album_id, selecao_id, numero, nome, descricao, ordem) VALUES
  ('fig-sed-01', 'copa2026', 'sel-sed', '1',  'SoFi Stadium',               'Los Angeles',          1),
  ('fig-sed-02', 'copa2026', 'sel-sed', '2',  'MetLife Stadium',             'Nova York/NJ',         2),
  ('fig-sed-03', 'copa2026', 'sel-sed', '3',  'AT&T Stadium',               'Dallas',               3),
  ('fig-sed-04', 'copa2026', 'sel-sed', '4',  'Levi''s Stadium',            'San Francisco',        4),
  ('fig-sed-05', 'copa2026', 'sel-sed', '5',  'Lumen Field',                'Seattle',              5),
  ('fig-sed-06', 'copa2026', 'sel-sed', '6',  'Arrowhead Stadium',          'Kansas City',          6),
  ('fig-sed-07', 'copa2026', 'sel-sed', '7',  'Lincoln Financial Field',    'Filadélfia',           7),
  ('fig-sed-08', 'copa2026', 'sel-sed', '8',  'Hard Rock Stadium',          'Miami',                8),
  ('fig-sed-09', 'copa2026', 'sel-sed', '9',  'Mercedes-Benz Stadium',      'Atlanta',              9),
  ('fig-sed-10', 'copa2026', 'sel-sed', '10', 'NRG Stadium',                'Houston',             10),
  ('fig-sed-11', 'copa2026', 'sel-sed', '11', 'Gillette Stadium',           'Boston',              11),
  ('fig-sed-12', 'copa2026', 'sel-sed', '12', 'BC Place',                   'Vancouver',           12),
  ('fig-sed-13', 'copa2026', 'sel-sed', '13', 'BMO Field',                  'Toronto',             13),
  ('fig-sed-14', 'copa2026', 'sel-sed', '14', 'Estadio Azteca',             'Cidade do México',    14),
  ('fig-sed-15', 'copa2026', 'sel-sed', '15', 'Estadio Akron',              'Guadalajara',         15),
  ('fig-sed-16', 'copa2026', 'sel-sed', '16', 'Estadio BBVA',               'Monterrey',           16)
ON CONFLICT (id) DO NOTHING;

-- ── FIGURINHAS: SELEÇÕES (48 × 20 = 960) ────────────────────
-- Numeração: cada seleção começa em 1.
-- Posições padrão:
--   1  Escudo          11 Meia
--   2  Plantel         12 Meia
--   3  Goleiro 1       13 Meia-Atacante
--   4  Goleiro 2       14 Ponta-Direita
--   5  Lateral-Direito 15 Centroavante
--   6  Zagueiro        16 Ponta-Esquerda
--   7  Zagueiro        17 Atacante
--   8  Lateral-Esquerdo 18 Craque
--   9  Volante         19 Destaque
--  10  Volante         20 Técnico

WITH descricoes (n, descricao) AS (
  VALUES
    ( 1, 'Escudo'),
    ( 2, 'Plantel'),
    ( 3, 'Goleiro 1'),
    ( 4, 'Goleiro 2'),
    ( 5, 'Lateral-Direito'),
    ( 6, 'Zagueiro'),
    ( 7, 'Zagueiro'),
    ( 8, 'Lateral-Esquerdo'),
    ( 9, 'Volante'),
    (10, 'Volante'),
    (11, 'Meia'),
    (12, 'Meia'),
    (13, 'Meia-Atacante'),
    (14, 'Ponta-Direita'),
    (15, 'Centroavante'),
    (16, 'Ponta-Esquerda'),
    (17, 'Atacante'),
    (18, 'Craque'),
    (19, 'Destaque'),
    (20, 'Técnico')
),
times (sel_id, code) AS (
  VALUES
    -- Grupo A
    ('sel-mex', 'mex'), ('sel-ven', 'ven'), ('sel-nzl', 'nzl'),
    -- Grupo B
    ('sel-usa', 'usa'), ('sel-pan', 'pan'), ('sel-jor', 'jor'),
    -- Grupo C
    ('sel-can', 'can'), ('sel-mar', 'mar'), ('sel-hrv', 'hrv'),
    -- Grupo D
    ('sel-arg', 'arg'), ('sel-pol', 'pol'), ('sel-zaf', 'zaf'),
    -- Grupo E
    ('sel-esp', 'esp'), ('sel-srb', 'srb'), ('sel-jpn', 'jpn'),
    -- Grupo F
    ('sel-fra', 'fra'), ('sel-uru', 'uru'), ('sel-kor', 'kor'),
    -- Grupo G
    ('sel-por', 'por'), ('sel-cmr', 'cmr'), ('sel-qat', 'qat'),
    -- Grupo H
    ('sel-eng', 'eng'), ('sel-nga', 'nga'), ('sel-ecu', 'ecu'),
    -- Grupo I
    ('sel-ned', 'ned'), ('sel-sen', 'sen'), ('sel-aus', 'aus'),
    -- Grupo J
    ('sel-deu', 'deu'), ('sel-col', 'col'), ('sel-sau', 'sau'),
    -- Grupo K
    ('sel-bel', 'bel'), ('sel-dza', 'dza'), ('sel-uzb', 'uzb'),
    -- Grupo L
    ('sel-ita', 'ita'), ('sel-egy', 'egy'), ('sel-crc', 'crc'),
    -- Grupo M
    ('sel-bra', 'bra'), ('sel-gha', 'gha'), ('sel-hnd', 'hnd'),
    -- Grupo N
    ('sel-che', 'che'), ('sel-civ', 'civ'), ('sel-irn', 'irn'),
    -- Grupo O
    ('sel-aut', 'aut'), ('sel-idn', 'idn'), ('sel-mli', 'mli'),
    -- Grupo P
    ('sel-den', 'den'), ('sel-sco', 'sco'), ('sel-tur', 'tur')
)
INSERT INTO figurinhas (id, album_id, selecao_id, numero, nome, descricao, ordem)
SELECT
  'fig-' || t.code || '-' || lpad(d.n::text, 2, '0'),
  'copa2026',
  t.sel_id,
  d.n::text,
  '',          -- nome do jogador: preencher após escalações confirmadas
  d.descricao,
  d.n
FROM times t
CROSS JOIN descricoes d
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ── VERIFICAÇÃO ──────────────────────────────────────────────
-- Após executar, rode estas queries para conferir:
--
-- SELECT COUNT(*) FROM selecoes  WHERE album_id = 'copa2026';  -- esperado: 50
-- SELECT COUNT(*) FROM figurinhas WHERE album_id = 'copa2026'; -- esperado: 986
-- SELECT codigo_fifa, COUNT(*) FROM selecoes JOIN figurinhas
--   ON selecoes.id = figurinhas.selecao_id
--   WHERE selecoes.album_id = 'copa2026'
--   GROUP BY codigo_fifa ORDER BY codigo_fifa;
