// migrate_from_excel.mjs — Migra dados reais do álbum Panini Copa 2026
// Execute: node scripts/migrate_from_excel.mjs

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('C:/Users/RobertoManera/AppData/Roaming/npm/node_modules/xlsx');

const SUPABASE_URL = 'https://fmsojsxadjdigwppqnfa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
if (!SUPABASE_KEY) { console.error('Defina SUPABASE_SERVICE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ── UUID v5 deterministico ──────────────────────────────────

const NS = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');
function uuid(slug) {
  const h = createHash('sha1').update(NS).update(slug).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.toString('hex');
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20,32)}`;
}

const ALBUM_ID = uuid('copa2026');

// ── Mapeamento inglês → português + código FIFA + bandeira ─

const MAP = {
  'We Are Panini':             { slug: 'sel-paw', nome: 'We Are Panini',          codigo_fifa: 'PAW', bandeira_url: '' },
  'FIFA World Cup 2026':       { slug: 'sel-fwc', nome: 'Copa do Mundo FIFA 2026',codigo_fifa: 'FWC', bandeira_url: '' },
  'Host Countries and Cities': { slug: 'sel-hcc', nome: 'Países Sede',            codigo_fifa: 'HCC', bandeira_url: '' },
  'FIFA World Cup History':    { slug: 'sel-fwh', nome: 'História da Copa',        codigo_fifa: 'FWH', bandeira_url: '' },
  'Algeria':          { slug: 'sel-dza', nome: 'Argélia',            codigo_fifa: 'DZA', bandeira_url: 'https://flagcdn.com/w80/dz.png' },
  'Argentina':        { slug: 'sel-arg', nome: 'Argentina',          codigo_fifa: 'ARG', bandeira_url: 'https://flagcdn.com/w80/ar.png' },
  'Australia':        { slug: 'sel-aus', nome: 'Austrália',          codigo_fifa: 'AUS', bandeira_url: 'https://flagcdn.com/w80/au.png' },
  'Austria':          { slug: 'sel-aut', nome: 'Áustria',            codigo_fifa: 'AUT', bandeira_url: 'https://flagcdn.com/w80/at.png' },
  'Belgium':          { slug: 'sel-bel', nome: 'Bélgica',            codigo_fifa: 'BEL', bandeira_url: 'https://flagcdn.com/w80/be.png' },
  'Bosnia and Herzegovina': { slug: 'sel-bih', nome: 'Bósnia e Herzegovina', codigo_fifa: 'BIH', bandeira_url: 'https://flagcdn.com/w80/ba.png' },
  'Brazil':           { slug: 'sel-bra', nome: 'Brasil',             codigo_fifa: 'BRA', bandeira_url: 'https://flagcdn.com/w80/br.png' },
  'Canada':           { slug: 'sel-can', nome: 'Canadá',             codigo_fifa: 'CAN', bandeira_url: 'https://flagcdn.com/w80/ca.png' },
  'Cape Verde':       { slug: 'sel-cpv', nome: 'Cabo Verde',         codigo_fifa: 'CPV', bandeira_url: 'https://flagcdn.com/w80/cv.png' },
  'Colombia':         { slug: 'sel-col', nome: 'Colômbia',           codigo_fifa: 'COL', bandeira_url: 'https://flagcdn.com/w80/co.png' },
  'Congo DR':         { slug: 'sel-cod', nome: 'Congo RD',           codigo_fifa: 'COD', bandeira_url: 'https://flagcdn.com/w80/cd.png' },
  'Croatia':          { slug: 'sel-hrv', nome: 'Croácia',            codigo_fifa: 'HRV', bandeira_url: 'https://flagcdn.com/w80/hr.png' },
  'Curaçao':          { slug: 'sel-cuw', nome: 'Curaçao',            codigo_fifa: 'CUW', bandeira_url: 'https://flagcdn.com/w80/cw.png' },
  'Czechia':          { slug: 'sel-cze', nome: 'Chéquia',            codigo_fifa: 'CZE', bandeira_url: 'https://flagcdn.com/w80/cz.png' },
  'Ecuador':          { slug: 'sel-ecu', nome: 'Equador',            codigo_fifa: 'ECU', bandeira_url: 'https://flagcdn.com/w80/ec.png' },
  'Egypt':            { slug: 'sel-egy', nome: 'Egito',              codigo_fifa: 'EGY', bandeira_url: 'https://flagcdn.com/w80/eg.png' },
  'England':          { slug: 'sel-eng', nome: 'Inglaterra',         codigo_fifa: 'ENG', bandeira_url: 'https://flagcdn.com/w80/gb-eng.png' },
  'France':           { slug: 'sel-fra', nome: 'França',             codigo_fifa: 'FRA', bandeira_url: 'https://flagcdn.com/w80/fr.png' },
  'Germany':          { slug: 'sel-deu', nome: 'Alemanha',           codigo_fifa: 'DEU', bandeira_url: 'https://flagcdn.com/w80/de.png' },
  'Ghana':            { slug: 'sel-gha', nome: 'Gana',               codigo_fifa: 'GHA', bandeira_url: 'https://flagcdn.com/w80/gh.png' },
  'Haiti':            { slug: 'sel-hai', nome: 'Haiti',              codigo_fifa: 'HAI', bandeira_url: 'https://flagcdn.com/w80/ht.png' },
  'Iran':             { slug: 'sel-irn', nome: 'Irã',                codigo_fifa: 'IRN', bandeira_url: 'https://flagcdn.com/w80/ir.png' },
  'Iraq':             { slug: 'sel-irq', nome: 'Iraque',             codigo_fifa: 'IRQ', bandeira_url: 'https://flagcdn.com/w80/iq.png' },
  'Ivory Coast':      { slug: 'sel-civ', nome: 'Costa do Marfim',    codigo_fifa: 'CIV', bandeira_url: 'https://flagcdn.com/w80/ci.png' },
  'Japan':            { slug: 'sel-jpn', nome: 'Japão',              codigo_fifa: 'JPN', bandeira_url: 'https://flagcdn.com/w80/jp.png' },
  'Jordan':           { slug: 'sel-jor', nome: 'Jordânia',           codigo_fifa: 'JOR', bandeira_url: 'https://flagcdn.com/w80/jo.png' },
  'Mexico':           { slug: 'sel-mex', nome: 'México',             codigo_fifa: 'MEX', bandeira_url: 'https://flagcdn.com/w80/mx.png' },
  'Morocco':          { slug: 'sel-mar', nome: 'Marrocos',           codigo_fifa: 'MAR', bandeira_url: 'https://flagcdn.com/w80/ma.png' },
  'Netherlands':      { slug: 'sel-ned', nome: 'Países Baixos',      codigo_fifa: 'NED', bandeira_url: 'https://flagcdn.com/w80/nl.png' },
  'New Zealand':      { slug: 'sel-nzl', nome: 'Nova Zelândia',      codigo_fifa: 'NZL', bandeira_url: 'https://flagcdn.com/w80/nz.png' },
  'Norway':           { slug: 'sel-nor', nome: 'Noruega',            codigo_fifa: 'NOR', bandeira_url: 'https://flagcdn.com/w80/no.png' },
  'Panama':           { slug: 'sel-pan', nome: 'Panamá',             codigo_fifa: 'PAN', bandeira_url: 'https://flagcdn.com/w80/pa.png' },
  'Paraguay':         { slug: 'sel-par', nome: 'Paraguai',           codigo_fifa: 'PAR', bandeira_url: 'https://flagcdn.com/w80/py.png' },
  'Portugal':         { slug: 'sel-por', nome: 'Portugal',           codigo_fifa: 'POR', bandeira_url: 'https://flagcdn.com/w80/pt.png' },
  'Qatar':            { slug: 'sel-qat', nome: 'Catar',              codigo_fifa: 'QAT', bandeira_url: 'https://flagcdn.com/w80/qa.png' },
  'Saudi Arabia':     { slug: 'sel-sau', nome: 'Arábia Saudita',     codigo_fifa: 'SAU', bandeira_url: 'https://flagcdn.com/w80/sa.png' },
  'Scotland':         { slug: 'sel-sco', nome: 'Escócia',            codigo_fifa: 'SCO', bandeira_url: 'https://flagcdn.com/w80/gb-sct.png' },
  'Senegal':          { slug: 'sel-sen', nome: 'Senegal',            codigo_fifa: 'SEN', bandeira_url: 'https://flagcdn.com/w80/sn.png' },
  'South Africa':     { slug: 'sel-zaf', nome: 'África do Sul',      codigo_fifa: 'ZAF', bandeira_url: 'https://flagcdn.com/w80/za.png' },
  'South Korea':      { slug: 'sel-kor', nome: 'Coreia do Sul',      codigo_fifa: 'KOR', bandeira_url: 'https://flagcdn.com/w80/kr.png' },
  'Spain':            { slug: 'sel-esp', nome: 'Espanha',            codigo_fifa: 'ESP', bandeira_url: 'https://flagcdn.com/w80/es.png' },
  'Sweden':           { slug: 'sel-swe', nome: 'Suécia',             codigo_fifa: 'SWE', bandeira_url: 'https://flagcdn.com/w80/se.png' },
  'Switzerland':      { slug: 'sel-che', nome: 'Suíça',              codigo_fifa: 'CHE', bandeira_url: 'https://flagcdn.com/w80/ch.png' },
  'Tunisia':          { slug: 'sel-tun', nome: 'Tunísia',            codigo_fifa: 'TUN', bandeira_url: 'https://flagcdn.com/w80/tn.png' },
  'Türkiye':          { slug: 'sel-tur', nome: 'Turquia',            codigo_fifa: 'TUR', bandeira_url: 'https://flagcdn.com/w80/tr.png' },
  'USA':              { slug: 'sel-usa', nome: 'Estados Unidos',     codigo_fifa: 'USA', bandeira_url: 'https://flagcdn.com/w80/us.png' },
  'Uruguay':          { slug: 'sel-uru', nome: 'Uruguai',            codigo_fifa: 'URU', bandeira_url: 'https://flagcdn.com/w80/uy.png' },
  'Uzbekistan':       { slug: 'sel-uzb', nome: 'Uzbequistão',        codigo_fifa: 'UZB', bandeira_url: 'https://flagcdn.com/w80/uz.png' },
};

// ── Leitura do Excel ────────────────────────────────────────

function loadExcel(path) {
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

  // Inclui todas as linhas com nome selecao preenchido e numero não vazio
  return raw.filter(r =>
    r['nome selecao'] !== '' &&
    (typeof r.numero === 'string' ? r.numero.trim() !== '' : r.numero !== '')
  );
}

// ── Construção dos dados ────────────────────────────────────

function buildData(rows) {
  // Ordem das seções conforme aparecem no arquivo
  const secoesOrdem = [];
  const seenSel = new Set();
  for (const r of rows) {
    const en = r['nome selecao'];
    if (!seenSel.has(en)) { seenSel.add(en); secoesOrdem.push(en); }
  }

  // Verifica mapeamentos em falta
  const missing = secoesOrdem.filter(s => !MAP[s]);
  if (missing.length) { console.error('Sem mapeamento para:', missing); process.exit(1); }

  const selecoes = secoesOrdem.map((en, i) => {
    const m = MAP[en];
    return { id: uuid(m.slug), album_id: ALBUM_ID, nome: m.nome, codigo_fifa: m.codigo_fifa, ordem: i + 1, bandeira_url: m.bandeira_url };
  });

  const counter = new Map();
  const figurinhas = rows.map(r => {
    const en = r['nome selecao'];
    const m = MAP[en];
    const numero = String(r.numero);
    const ordem = (counter.get(en) || 0) + 1;
    counter.set(en, ordem);
    return {
      id: uuid(`fig-${m.slug}-${numero}`),
      album_id: ALBUM_ID,
      selecao_id: uuid(m.slug),
      numero,
      nome: String(r.descricao || ''),
      type: String(r.Type || ''),
      descricao: '',
      ordem,
    };
  });

  return { selecoes, figurinhas };
}

// ── Upsert em chunks ────────────────────────────────────────

async function upsert(table, rows, label) {
  const CHUNK = 100;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict: 'id' });
    if (error) { console.error(`\nERRO em ${label}:`, error.message); process.exit(1); }
    done += Math.min(CHUNK, rows.length - i);
    process.stdout.write(`\r  ${label}: ${done}/${rows.length}`);
  }
  console.log(`\r  ${label}: ${done} OK          `);
}

// ── Execução ────────────────────────────────────────────────

async function main() {
  const EXCEL = 'C:/Users/RobertoManera/Downloads/dados album copa.xlsx';
  console.log('=== Migração: Álbum Copa 2026 (dados reais) ===\n');
  console.log('Lendo Excel...');

  const rows = loadExcel(EXCEL);
  const { selecoes, figurinhas } = buildData(rows);

  console.log(`  Seções  : ${selecoes.length}`);
  console.log(`  Figurinhas: ${figurinhas.length}\n`);

  // 1. Apaga dados antigos
  console.log('Limpando dados antigos...');
  const { error: e1 } = await supabase.from('figurinhas').delete().eq('album_id', ALBUM_ID);
  if (e1) { console.error('Erro ao apagar figurinhas:', e1.message); process.exit(1); }
  console.log('  figurinhas apagadas');

  const { error: e2 } = await supabase.from('selecoes').delete().eq('album_id', ALBUM_ID);
  if (e2) { console.error('Erro ao apagar selecoes:', e2.message); process.exit(1); }
  console.log('  selecoes apagadas\n');

  // 2. Insere novos dados
  console.log('Inserindo novos dados...');
  await upsert('selecoes',   selecoes,   'seleções  ');
  await upsert('figurinhas', figurinhas, 'figurinhas');

  console.log('\n=== Concluído ===');
  console.log(`  Seleções   : ${selecoes.length}`);
  console.log(`  Figurinhas : ${figurinhas.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
