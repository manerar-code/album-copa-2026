// seed.mjs — Popula o Supabase com os dados do Álbum Copa 2026
// Execute: node scripts/seed.mjs

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const SUPABASE_URL = 'https://fmsojsxadjdigwppqnfa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Defina SUPABASE_SERVICE_KEY ou EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ── UUID v5 deterministico (mesmo slug = mesmo UUID toda execução) ──

const NS = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex'); // namespace URL

function uuid(slug) {
  const h = createHash('sha1').update(NS).update(slug).digest();
  h[6] = (h[6] & 0x0f) | 0x50;  // version 5
  h[8] = (h[8] & 0x3f) | 0x80;  // variant
  const x = h.toString('hex');
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20,32)}`;
}

// ── Dados ──────────────────────────────────────────────────────

const ALBUM_ID = uuid('copa2026');

const ALBUM = { id: ALBUM_ID, nome: 'Copa do Mundo FIFA 2026', versao: 1 };

const SELECOES_DEF = [
  ['sel-abt', 'Abertura',        'ABT',  1, ''],
  ['sel-sed', 'Sedes',           'SED',  2, ''],
  // Grupo A
  ['sel-mex', 'México',          'MEX', 10, 'https://flagcdn.com/w80/mx.png'],
  ['sel-ven', 'Venezuela',       'VEN', 11, 'https://flagcdn.com/w80/ve.png'],
  ['sel-nzl', 'Nova Zelândia',   'NZL', 12, 'https://flagcdn.com/w80/nz.png'],
  // Grupo B
  ['sel-usa', 'Estados Unidos',  'USA', 13, 'https://flagcdn.com/w80/us.png'],
  ['sel-pan', 'Panamá',          'PAN', 14, 'https://flagcdn.com/w80/pa.png'],
  ['sel-jor', 'Jordânia',        'JOR', 15, 'https://flagcdn.com/w80/jo.png'],
  // Grupo C
  ['sel-can', 'Canadá',          'CAN', 16, 'https://flagcdn.com/w80/ca.png'],
  ['sel-mar', 'Marrocos',        'MAR', 17, 'https://flagcdn.com/w80/ma.png'],
  ['sel-hrv', 'Croácia',         'HRV', 18, 'https://flagcdn.com/w80/hr.png'],
  // Grupo D
  ['sel-arg', 'Argentina',       'ARG', 19, 'https://flagcdn.com/w80/ar.png'],
  ['sel-pol', 'Polônia',         'POL', 20, 'https://flagcdn.com/w80/pl.png'],
  ['sel-zaf', 'África do Sul',   'ZAF', 21, 'https://flagcdn.com/w80/za.png'],
  // Grupo E
  ['sel-esp', 'Espanha',         'ESP', 22, 'https://flagcdn.com/w80/es.png'],
  ['sel-srb', 'Sérvia',          'SRB', 23, 'https://flagcdn.com/w80/rs.png'],
  ['sel-jpn', 'Japão',           'JPN', 24, 'https://flagcdn.com/w80/jp.png'],
  // Grupo F
  ['sel-fra', 'França',          'FRA', 25, 'https://flagcdn.com/w80/fr.png'],
  ['sel-uru', 'Uruguai',         'URU', 26, 'https://flagcdn.com/w80/uy.png'],
  ['sel-kor', 'Coreia do Sul',   'KOR', 27, 'https://flagcdn.com/w80/kr.png'],
  // Grupo G
  ['sel-por', 'Portugal',        'POR', 28, 'https://flagcdn.com/w80/pt.png'],
  ['sel-cmr', 'Camarões',        'CMR', 29, 'https://flagcdn.com/w80/cm.png'],
  ['sel-qat', 'Catar',           'QAT', 30, 'https://flagcdn.com/w80/qa.png'],
  // Grupo H
  ['sel-eng', 'Inglaterra',      'ENG', 31, 'https://flagcdn.com/w80/gb-eng.png'],
  ['sel-nga', 'Nigéria',         'NGA', 32, 'https://flagcdn.com/w80/ng.png'],
  ['sel-ecu', 'Equador',         'ECU', 33, 'https://flagcdn.com/w80/ec.png'],
  // Grupo I
  ['sel-ned', 'Países Baixos',   'NED', 34, 'https://flagcdn.com/w80/nl.png'],
  ['sel-sen', 'Senegal',         'SEN', 35, 'https://flagcdn.com/w80/sn.png'],
  ['sel-aus', 'Austrália',       'AUS', 36, 'https://flagcdn.com/w80/au.png'],
  // Grupo J
  ['sel-deu', 'Alemanha',        'DEU', 37, 'https://flagcdn.com/w80/de.png'],
  ['sel-col', 'Colômbia',        'COL', 38, 'https://flagcdn.com/w80/co.png'],
  ['sel-sau', 'Arábia Saudita',  'SAU', 39, 'https://flagcdn.com/w80/sa.png'],
  // Grupo K
  ['sel-bel', 'Bélgica',         'BEL', 40, 'https://flagcdn.com/w80/be.png'],
  ['sel-dza', 'Argélia',         'DZA', 41, 'https://flagcdn.com/w80/dz.png'],
  ['sel-uzb', 'Uzbequistão',     'UZB', 42, 'https://flagcdn.com/w80/uz.png'],
  // Grupo L
  ['sel-ita', 'Itália',          'ITA', 43, 'https://flagcdn.com/w80/it.png'],
  ['sel-egy', 'Egito',           'EGY', 44, 'https://flagcdn.com/w80/eg.png'],
  ['sel-crc', 'Costa Rica',      'CRC', 45, 'https://flagcdn.com/w80/cr.png'],
  // Grupo M
  ['sel-bra', 'Brasil',          'BRA', 46, 'https://flagcdn.com/w80/br.png'],
  ['sel-gha', 'Gana',            'GHA', 47, 'https://flagcdn.com/w80/gh.png'],
  ['sel-hnd', 'Honduras',        'HND', 48, 'https://flagcdn.com/w80/hn.png'],
  // Grupo N
  ['sel-che', 'Suíça',           'CHE', 49, 'https://flagcdn.com/w80/ch.png'],
  ['sel-civ', 'Costa do Marfim', 'CIV', 50, 'https://flagcdn.com/w80/ci.png'],
  ['sel-irn', 'Irã',             'IRN', 51, 'https://flagcdn.com/w80/ir.png'],
  // Grupo O
  ['sel-aut', 'Áustria',         'AUT', 52, 'https://flagcdn.com/w80/at.png'],
  ['sel-idn', 'Indonésia',       'IDN', 53, 'https://flagcdn.com/w80/id.png'],
  ['sel-mli', 'Mali',            'MLI', 54, 'https://flagcdn.com/w80/ml.png'],
  // Grupo P
  ['sel-den', 'Dinamarca',       'DEN', 55, 'https://flagcdn.com/w80/dk.png'],
  ['sel-sco', 'Escócia',         'SCO', 56, 'https://flagcdn.com/w80/gb-sct.png'],
  ['sel-tur', 'Turquia',         'TUR', 57, 'https://flagcdn.com/w80/tr.png'],
];

const SELECOES = SELECOES_DEF.map(([slug, nome, codigo_fifa, ordem, bandeira_url]) => ({
  id: uuid(slug),
  album_id: ALBUM_ID,
  nome,
  codigo_fifa,
  ordem,
  bandeira_url,
}));

// Mapa slug → UUID para referenciar nas figurinhas
const SEL_ID = Object.fromEntries(SELECOES_DEF.map(([slug]) => [slug, uuid(slug)]));

// Figurinhas especiais: ABT (10) + SED (16)
const ESPECIAIS = [
  ['fig-abt-01', 'sel-abt', '1',  'Capa do Álbum',           'Abertura',        1],
  ['fig-abt-02', 'sel-abt', '2',  'Troféu FIFA',             'Troféu',          2],
  ['fig-abt-03', 'sel-abt', '3',  'Mascote Oficial',         'Mascote',         3],
  ['fig-abt-04', 'sel-abt', '4',  'Bola Oficial adidas',     'Bola Oficial',    4],
  ['fig-abt-05', 'sel-abt', '5',  'Países Anfitriões',       'Apresentação',    5],
  ['fig-abt-06', 'sel-abt', '6',  'Sede — EUA',              'Apresentação',    6],
  ['fig-abt-07', 'sel-abt', '7',  'Sede — Canadá',           'Apresentação',    7],
  ['fig-abt-08', 'sel-abt', '8',  'Sede — México',           'Apresentação',    8],
  ['fig-abt-09', 'sel-abt', '9',  'Maiores Campeões',        'História',        9],
  ['fig-abt-10', 'sel-abt', '10', 'Galeria de Lendas',       'História',       10],
  ['fig-sed-01', 'sel-sed', '1',  'SoFi Stadium',            'Los Angeles',      1],
  ['fig-sed-02', 'sel-sed', '2',  'MetLife Stadium',         'Nova York/NJ',     2],
  ['fig-sed-03', 'sel-sed', '3',  'AT&T Stadium',            'Dallas',           3],
  ['fig-sed-04', 'sel-sed', '4',  "Levi's Stadium",          'San Francisco',    4],
  ['fig-sed-05', 'sel-sed', '5',  'Lumen Field',             'Seattle',          5],
  ['fig-sed-06', 'sel-sed', '6',  'Arrowhead Stadium',       'Kansas City',      6],
  ['fig-sed-07', 'sel-sed', '7',  'Lincoln Financial Field', 'Filadélfia',       7],
  ['fig-sed-08', 'sel-sed', '8',  'Hard Rock Stadium',       'Miami',            8],
  ['fig-sed-09', 'sel-sed', '9',  'Mercedes-Benz Stadium',   'Atlanta',          9],
  ['fig-sed-10', 'sel-sed', '10', 'NRG Stadium',             'Houston',         10],
  ['fig-sed-11', 'sel-sed', '11', 'Gillette Stadium',        'Boston',          11],
  ['fig-sed-12', 'sel-sed', '12', 'BC Place',                'Vancouver',       12],
  ['fig-sed-13', 'sel-sed', '13', 'BMO Field',               'Toronto',         13],
  ['fig-sed-14', 'sel-sed', '14', 'Estadio Azteca',          'Cidade do México',14],
  ['fig-sed-15', 'sel-sed', '15', 'Estadio Akron',           'Guadalajara',     15],
  ['fig-sed-16', 'sel-sed', '16', 'Estadio BBVA',            'Monterrey',       16],
].map(([slug, selSlug, numero, nome, descricao, ordem]) => ({
  id: uuid(slug),
  album_id: ALBUM_ID,
  selecao_id: SEL_ID[selSlug],
  numero,
  nome,
  descricao,
  ordem,
}));

const POSICOES = [
  'Escudo','Plantel',
  'Goleiro 1','Goleiro 2',
  'Lateral-Direito','Zagueiro','Zagueiro','Lateral-Esquerdo',
  'Volante','Volante','Meia','Meia','Meia-Atacante',
  'Ponta-Direita','Centroavante','Ponta-Esquerda','Atacante',
  'Craque','Destaque','Técnico',
];

const TIMES_SLUGS = SELECOES_DEF
  .filter(([slug]) => slug !== 'sel-abt' && slug !== 'sel-sed')
  .map(([slug]) => slug);

function buildFigurinhasTimes() {
  const rows = [];
  for (const selSlug of TIMES_SLUGS) {
    const code = selSlug.replace('sel-', '');
    for (let n = 1; n <= 20; n++) {
      const slug = `fig-${code}-${String(n).padStart(2,'0')}`;
      rows.push({
        id: uuid(slug),
        album_id: ALBUM_ID,
        selecao_id: SEL_ID[selSlug],
        numero: String(n),
        nome: '',
        descricao: POSICOES[n - 1],
        ordem: n,
      });
    }
  }
  return rows;
}

// ── Execução ────────────────────────────────────────────────────

async function upsert(table, rows, label) {
  const CHUNK = 100;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`\n  ERRO em ${label} (chunk ${i}): ${error.message}`);
      process.exit(1);
    }
    done += chunk.length;
    process.stdout.write(`\r  ${label}: ${done}/${rows.length}`);
  }
  console.log(`\r  ${label}: ${done} OK          `);
}

async function main() {
  console.log('=== Seed: Álbum Copa 2026 ===\n');

  await upsert('albums',     [ALBUM],                                    'álbum    ');
  await upsert('selecoes',   SELECOES,                                   'seleções ');

  const figurinhas = [...ESPECIAIS, ...buildFigurinhasTimes()];
  await upsert('figurinhas', figurinhas,                                 'figurinhas');

  console.log('\n=== Concluído ===');
  console.log(`  álbuns     : 1`);
  console.log(`  seleções   : ${SELECOES.length}`);
  console.log(`  figurinhas : ${figurinhas.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
