import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backup, restore, documents } from '../scripts/backup.mjs';

test('respaldo cifrado, simulación, recuperación exacta y rechazo de alteraciones', async () => {
 process.env.BACKUP_KEY=randomBytes(32).toString('base64');
 process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:18081';
 const suffix=randomBytes(4).toString('hex');
 const source='demo-backup-'+suffix, target='demo-restore-'+suffix;
 const dir=await mkdtemp(join(tmpdir(),'nosql-backup-'));const file=join(dir,'backup.enc.json');
 try {
  const fields={title:{stringValue:'Ensayar recuperación'},completed:{booleanValue:false},createdAt:{timestampValue:'2026-11-19T12:00:00Z'}};
  const url=`http://127.0.0.1:18081/v1/projects/${source}/databases/(default)/documents/users/alumno/tasks/uno`;
  const seed=await fetch(url,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields})});
  assert.equal(seed.ok,true);
  const result=await backup(source,file);assert.equal(result.count,1);
  assert.equal((await readFile(file,'utf8')).includes('Ensayar recuperación'),false);
  assert.deepEqual(await restore(target,file),{dryRun:true,count:1});
  assert.equal((await documents(target)).length,0);
  const restored=await restore(target,file,true);assert.equal(restored.restored,1);assert.equal(restored.sha256,result.sha256);
  await assert.rejects(restore(target,file,true),/vacío/);
  await assert.rejects(restore(source,file,true),/distintos/);
  const envelope=JSON.parse(await readFile(file,'utf8'));const bytes=Buffer.from(envelope.ciphertext,'base64');bytes[0]^=1;envelope.ciphertext=bytes.toString('base64');
  await writeFile(join(dir,'damaged.json'),JSON.stringify(envelope));
  await assert.rejects(restore('demo-damaged-'+suffix,join(dir,'damaged.json'),true));
  assert.equal((await documents('demo-damaged-'+suffix)).length,0);
 } finally {await rm(dir,{recursive:true,force:true});}
});
