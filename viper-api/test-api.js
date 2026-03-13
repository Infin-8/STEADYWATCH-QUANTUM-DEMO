#!/usr/bin/env node
/**
 * VIPER API — smoke tests. Run with: npm test (or node test-api.js)
 * Requires the API to be running: npm start (in another terminal).
 */
const http = require('http');

const BASE = process.env.VIPER_API_BASE || 'http://localhost:5001';
const API_KEY = process.env.VIPER_API_KEY || 'viper-demo-key-change-in-production';

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
    if (useAuth) opts.headers['X-Viper-Api-Key'] = API_KEY;
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', ch => (data += ch));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
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
    const r = await request('GET', '/api/viper/health', null, false);
    const pass = r.status === 200 && r.body.status === 'ok' && r.body.keys === 336;
    results.push({ name: 'GET /api/viper/health', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/viper/health', pass: false, error: e.message }); }

  // 2. Status (auth)
  try {
    const r = await request('GET', '/api/viper/status', null, true);
    const pass = r.status === 200 && r.body.keys === 336 && Array.isArray(r.body.arms);
    results.push({ name: 'GET /api/viper/status', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/viper/status', pass: false, error: e.message }); }

  // 3. Scan — strike tier (auth)
  try {
    const r = await request('POST', '/api/viper/scan', { input: 'test-input-smoke', tier: 'strike', sensitivity: 0.5 }, true);
    const pass = r.status === 200 && r.body.threatLevel && r.body.vector && typeof r.body.confidence === 'number';
    results.push({ name: 'POST /api/viper/scan (strike)', pass, detail: pass ? `${r.body.threatLevel} / ${r.body.vector} / ${r.body.confidence}` : '' });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'POST /api/viper/scan (strike)', pass: false, error: e.message }); }

  // 4. Scan — scout tier (auth)
  try {
    const r = await request('POST', '/api/viper/scan', { input: 'port scan 0.0.0.0', tier: 'scout', sensitivity: 0.5 }, true);
    const pass = r.status === 200 && r.body.tier === 'scout' && r.body.vector === 'RECON';
    results.push({ name: 'POST /api/viper/scan (scout)', pass, detail: pass ? `vector=${r.body.vector}` : `got vector=${r.body.vector}` });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'POST /api/viper/scan (scout)', pass: false, error: e.message }); }

  // 5. Alerts (auth)
  try {
    const r = await request('GET', '/api/viper/alerts?limit=5', null, true);
    const pass = r.status === 200 && Array.isArray(r.body.alerts);
    results.push({ name: 'GET /api/viper/alerts', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/viper/alerts', pass: false, error: e.message }); }

  // 6. Vectors (auth)
  try {
    const r = await request('GET', '/api/viper/vectors', null, true);
    const pass = r.status === 200 && Array.isArray(r.body.vectors) && r.body.vectors.length === 4;
    results.push({ name: 'GET /api/viper/vectors', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/viper/vectors', pass: false, error: e.message }); }

  results.forEach(t => {
    console.log(t.pass ? '  ✓' : '  ✗', t.name, t.detail || '', t.error || '');
  });
  console.log('\n' + ok + '/' + results.length + ' passed. Base: ' + BASE);
  process.exit(ok === results.length ? 0 : 1);
}

run().catch(err => {
  console.error('Server not reachable at', BASE, err.message);
  console.error('Start the API with: npm start');
  process.exit(1);
});
