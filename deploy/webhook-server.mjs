// Webhook receiver per deploy VPS-only (nessuna dipendenza, Node >= 18).
// Riceve il push da GitHub e lancia deploy.sh in background.
// Config: WEBHOOK_SECRET (obbligatorio), WEBHOOK_PORT (default 9000), DEPLOY_SCRIPT (default /opt/108vision/deploy.sh)
import http from 'node:http';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';

const PORT = Number(process.env.WEBHOOK_PORT || 9000);
const SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/opt/108vision/deploy.sh';

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function verifySignature(req, body) {
  if (!SECRET) {
    log('WARN: WEBHOOK_SECRET non impostato — webhook NON protetto');
    return true;
  }
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy(); // limite 1 MB
  });
  req.on('end', () => {
    if (!verifySignature(req, body)) {
      log('firma non valida');
      res.writeHead(401);
      res.end('unauthorized');
      return;
    }

    let branch = 'n/a';
    try {
      const payload = JSON.parse(body);
      if (payload && payload.ref) branch = payload.ref.split('/').pop();
    } catch {
      // body non JSON: accetta comunque se la firma è valida
    }

    log(`deploy triggered (branch=${branch})`);
    res.writeHead(200);
    res.end('ok');

    // Risponde subito a GitHub; il deploy gira in background.
    execFile(
      '/bin/bash',
      [DEPLOY_SCRIPT],
      { env: { ...process.env, WEBHOOK_TRIGGERED: '1' } },
      (err, stdout, stderr) => {
        if (stdout) log(stdout.trim());
        if (err) log(`deploy failed: ${stderr || err.message}`);
        else log('deploy ok');
      },
    );
  });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`webhook in ascolto su 0.0.0.0:${PORT}/deploy`);
});
