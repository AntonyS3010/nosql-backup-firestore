import { readFile, appendFile } from 'node:fs/promises';
import { sign } from 'node:crypto';

// Intercambio OAuth de la cuenta de servicio; no requiere impersonación IAM.
try {
  const account = JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  });
  const assertion = unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`OAuth respondió ${response.status}.`);
  const { access_token } = await response.json();
  if (typeof access_token !== 'string' || /[\r\n]/.test(access_token)) throw new Error('Token inválido.');
  console.log(`::add-mask::${access_token}`);
  await appendFile(process.env.GITHUB_ENV, `BACKUP_ACCESS_TOKEN=${access_token}\n`);
} catch { console.error('No se pudo obtener el token temporal de lectura.'); process.exitCode = 1; }
