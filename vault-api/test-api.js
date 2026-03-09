#!/usr/bin/env node
/**
 * THE VAULT™ API — smoke tests. Run with: npm test (or node test-api.js)
 * Requires the API to be running: npm start (in another terminal).
 */
const http = require('http');

const BASE = process.env.VAULT_API_BASE || 'http://localhost:5003';
const API_KEY = process.env.VAULT_API_KEY || 'vault-demo-key-change-in-production';

function request(method, path, body, useAuth) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (useAuth) opts.headers['X-Vault-Api-Key'] = API_KEY;
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const results = [];
  let ok = 0;

  // 1. Health (no auth)
  try {
    const r = await request('GET', '/api/vault/health', null, false);
    const pass = r.status === 200 && r.body.status === 'ok' && r.body.slots === 81;
    results.push({ name: 'GET /api/vault/health', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'GET /api/vault/health', pass: false, error: e.message });
  }

  // 2. Slots (no auth)
  try {
    const r = await request('GET', '/api/vault/slots', null, false);
    const pass = r.status === 200 && r.body.slots === 81 && Array.isArray(r.body.filled);
    results.push({ name: 'GET /api/vault/slots', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'GET /api/vault/slots', pass: false, error: e.message });
  }

  // 3. Configs default (auth)
  try {
    const r = await request('GET', '/api/vault/configs/default', null, true);
    const pass = r.status === 200 && r.body.id === 'signature' && r.body.crownSlotIndex === 0;
    results.push({ name: 'GET /api/vault/configs/default', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'GET /api/vault/configs/default', pass: false, error: e.message });
  }

  // 4. Request key (auth)
  try {
    const r = await request('POST', '/api/vault/request', { slotIndex: 0 }, true);
    const pass = r.status === 200 && r.body.ok && r.body.keyReleased && r.body.keyMaterial;
    results.push({ name: 'POST /api/vault/request', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'POST /api/vault/request', pass: false, error: e.message });
  }

  // 5. Store (auth)
  try {
    const r = await request('POST', '/api/vault/store', { slotIndex: 0, encryptedPayload: 'dGVzdA==' }, true);
    const pass = r.status === 200 && r.body.ok && r.body.slotIndex === 0;
    results.push({ name: 'POST /api/vault/store', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'POST /api/vault/store', pass: false, error: e.message });
  }

  // 6. Audit (auth)
  try {
    const r = await request('GET', '/api/vault/audit?limit=5', null, true);
    const pass = r.status === 200 && Array.isArray(r.body.audit);
    results.push({ name: 'GET /api/vault/audit', pass });
    if (pass) ok++;
  } catch (e) {
    results.push({ name: 'GET /api/vault/audit', pass: false, error: e.message });
  }

  results.forEach((t) => {
    console.log(t.pass ? '  ✓' : '  ✗', t.name, t.error ? t.error : '');
  });
  console.log('\n' + ok + '/' + results.length + ' passed. Base: ' + BASE);
  process.exit(ok === results.length ? 0 : 1);
}

run().catch((err) => {
  console.error('Server not reachable at', BASE, err.message);
  console.error('Start the API with: npm start');
  process.exit(1);
});
