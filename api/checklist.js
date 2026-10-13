// Checklist compartilhado do guia InTEAgir.AI.
// JSON é armazenado no Vercel Blob (privado), não no filesystem da função.
// Cada atualização cria uma nova versão de checklist.json para evitar problemas
// de cache ao sobrescrever arquivos no Blob. A versão mais recente é usada.
import { get, list, put } from '@vercel/blob';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const PREFIX = 'inteagir/checklist/';
const IDS = [
  'docs', 'repo', 'stack', 'tasks',
  'nav', 'prof', 'student', 'responsive',
  'prompts', 'integration', 'template', 'review',
  'secondary', 'security', 'deploy', 'rehearsal',
];
const allowed = new Set(IDS);
const seed = () => Object.fromEntries(IDS.map(id => [id, false]));
const defaults = () => ({ checks: seed(), updatedAt: null });
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status=200) => Response.json(value, { status, headers });

function available() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.CHECKLIST_EDIT_KEY);
}
function authorized(supplied) {
  const secret = process.env.CHECKLIST_EDIT_KEY || '';
  const got = Buffer.from(supplied || '', 'utf8');
  const expected = Buffer.from(secret, 'utf8');
  return expected.length > 0 && got.length === expected.length && timingSafeEqual(got, expected);
}
async function readCurrent() {
  // Versões imutáveis contornam a propagação de cache de blobs sobrescritos.
  // Para um MVP de poucas dezenas de cliques isso é propositalmente simples.
  let cursor;
  let latest = null;
  do {
    const result = await list({ prefix: PREFIX, limit: 1000, ...(cursor ? {cursor} : {}) });
    for (const blob of result.blobs) {
      if (!blob.pathname.endsWith('.json')) continue;
      // Os nomes começam por um timestamp de 13 dígitos; ordem alfabética = temporal.
      if (!latest || blob.pathname > latest.pathname) latest = blob;
    }
    cursor = result.hasMore ? result.cursor : null;
  } while (cursor);

  if (!latest) return defaults();
  const result = await get(latest.pathname, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) throw new Error('Não foi possível ler o JSON de progresso.');
  const stored = await new Response(result.stream).json();
  const checks = seed();
  for (const id of IDS) checks[id] = stored?.checks?.[id] === true;
  return { checks, updatedAt: typeof stored?.updatedAt === 'string' ? stored.updatedAt : null };
}

export async function GET() {
  if (!available()) return json({error:'Configure BLOB_READ_WRITE_TOKEN e CHECKLIST_EDIT_KEY na Vercel.'}, 503);
  try { return json(await readCurrent()); }
  catch(error) { console.error('checklist GET:',error); return json({error:'Erro ao ler progresso compartilhado.'}, 500); }
}

export async function PATCH(request) {
  if (!available()) return json({error:'Armazenamento ainda não configurado.'}, 503);
  if (!authorized(request.headers.get('x-checklist-key'))) return json({error:'Chave da equipe incorreta.'}, 401);
  let input;
  try { input = await request.json(); }
  catch { return json({error:'É necessário enviar JSON válido.'},400); }
  if (!input || !allowed.has(input.id) || typeof input.checked !== 'boolean') return json({error:'ID ou valor inválido.'},400);
  try {
    const data = await readCurrent();
    data.checks[input.id] = input.checked;
    data.updatedAt = new Date().toISOString();
    // JSON real salvo na conta Vercel; uma versão por alteração.
    const pathname = `${PREFIX}${Date.now()}-${randomUUID()}.json`;
    await put(pathname, JSON.stringify(data), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return json(data);
  } catch(error) {
    console.error('checklist PATCH:', error);
    return json({error:'Falha ao salvar a alteração no Vercel Blob.'}, 500);
  }
}
