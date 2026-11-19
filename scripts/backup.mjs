import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
function key() {
  const value = Buffer.from(process.env.BACKUP_KEY ?? '', 'base64');
  if (value.length !== 32) throw new Error('BACKUP_KEY debe contener una clave Base64 de 32 bytes.');
  return value;
}
function base(project) {
  if (!/^[a-z][a-z0-9-]{4,40}$/.test(project ?? '')) throw new Error('ID de proyecto inválido.');
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (host && !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('El emulador debe ser local.');
  if (!host && !process.env.BACKUP_ACCESS_TOKEN) throw new Error('Falta el token temporal de lectura.');
  return `${host ? 'http://' + host : 'https://firestore.googleapis.com'}/v1/projects/${project}/databases/(default)/documents`;
}
async function request(url, options = {}) {
  const local = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const response = await fetch(url, { ...options, headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${local ? 'owner' : process.env.BACKUP_ACCESS_TOKEN}`
  }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Firestore respondió ${response.status}; no se generó un respaldo válido.`);
  return response.json();
}
export async function documents(project) {
  const rows = await request(base(project) + ':runQuery', { method: 'POST', body: JSON.stringify({
    structuredQuery: { from: [{ collectionId: 'tasks', allDescendants: true }], limit: 1001 }
  }) });
  if (!Array.isArray(rows) || rows.some(x => x.error)) throw new Error('Respuesta de consulta incompleta.');
  const docs = rows.filter(x => x.document).map(({ document: d }) => {
    const path = d.name.split('/documents/')[1];
    if (!/^users\/[^/]+\/tasks\/[^/]+$/.test(path)) throw new Error('Documento fuera del modelo de la app.');
    return { path, fields: d.fields };
  }).sort((a,b) => a.path.localeCompare(b.path));
  if (docs.length > 1000) throw new Error('El respaldo educativo admite hasta 1000 documentos; no se guarda un resultado parcial.');
  return docs;
}
export async function backup(project, file) {
  const secret = key();
  const docs = await documents(project);
  const payload = { format: 1, project, capturedAt: new Date().toISOString(), documents: docs, sha256: hash(docs) };
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  await mkdir(dirname(file), {recursive:true});
  await writeFile(file, JSON.stringify({ format: 1, algorithm:'aes-256-gcm', iv:iv.toString('base64'), tag:cipher.getAuthTag().toString('base64'), ciphertext:ciphertext.toString('base64') }), { mode:0o600 });
  return { count:docs.length, sha256:payload.sha256 };
}
export async function restore(project, file, apply = false) {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !project.startsWith('demo-')) throw new Error('La restauración de ensayo solo admite un emulador y un proyecto demo separado.');
  const envelope = JSON.parse(await readFile(file, 'utf8'));
  if (envelope.format !== 1 || envelope.algorithm !== 'aes-256-gcm') throw new Error('Formato no reconocido.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(envelope.iv,'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]);
  const payload = JSON.parse(plain.toString('utf8'));
  if (payload.format !== 1 || !Array.isArray(payload.documents) || payload.sha256 !== hash(payload.documents)) throw new Error('Integridad inválida.');
  if (payload.project === project) throw new Error('Origen y destino deben ser distintos.');
  if (payload.documents.length > 1000 || new Set(payload.documents.map(x=>x.path)).size !== payload.documents.length || payload.documents.some(d=>!/^users\/[^/]+\/tasks\/[^/]+$/.test(d.path))) throw new Error('Documentos inválidos.');
  if ((await documents(project)).length) throw new Error('El destino debe estar vacío.');
  if (!apply) return { dryRun:true, count:payload.documents.length };
  for (const d of payload.documents) {
    const path = d.path.split('/').map(encodeURIComponent).join('/');
    await request(base(project)+'/'+path+'?currentDocument.exists=false', {method:'PATCH',body:JSON.stringify({fields:d.fields})});
  }
  const actual = await documents(project);
  if (hash(actual) !== payload.sha256) throw new Error('La comparación posterior a restaurar no coincide.');
  return { restored:actual.length, sha256:payload.sha256 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command,project,file] = process.argv.slice(2);
    if (!file || !['backup','restore'].includes(command)) throw new Error('Uso: node scripts/backup.mjs backup|restore PROYECTO ARCHIVO [--apply]');
    console.log(JSON.stringify(await (command === 'backup' ? backup(project,file) : restore(project,file,process.argv.includes('--apply')))));
  } catch (error) { console.error(error.message);process.exitCode=1; }
}
