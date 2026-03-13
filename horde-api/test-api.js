#!/usr/bin/env node
/**
 * HORDE API — smoke tests. Run with: npm test (or node test-api.js)
 * Requires the API to be running: npm start (in another terminal).
 */
const http = require('http');

const BASE = process.env.HORDE_API_BASE || 'http://localhost:5002';
const API_KEY = process.env.HORDE_API_KEY || 'horde-demo-key-change-in-production';

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
    if (useAuth) opts.headers['X-Horde-Api-Key'] = API_KEY;
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
    const r = await request('GET', '/api/horde/health', null, false);
    const pass = r.status === 200 && r.body.status === 'ok' && r.body.nodes === 432;
    results.push({ name: 'GET /api/horde/health', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/horde/health', pass: false, error: e.message }); }

  // 2. Status (auth)
  try {
    const r = await request('GET', '/api/horde/status', null, true);
    const pass = r.status === 200 && r.body.nodes === 432 && Array.isArray(r.body.clusters);
    results.push({ name: 'GET /api/horde/status', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/horde/status', pass: false, error: e.message }); }

  // 3. Respond — swarm tier (auth)
  try {
    const r = await request('POST', '/api/horde/respond', { input: 'test-swarm-smoke', tier: 'swarm', sensitivity: 0.5 }, true);
    const pass = r.status === 200 && r.body.threatLevel && r.body.defensePosture && typeof r.body.consensusScore === 'number';
    results.push({ name: 'POST /api/horde/respond (swarm)', pass, detail: pass ? `${r.body.threatLevel} / ${r.body.defensePosture} / ${(r.body.consensusScore*100).toFixed(1)}% consensus` : '' });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'POST /api/horde/respond (swarm)', pass: false, error: e.message }); }

  // 4. Respond — colony tier (auth)
  try {
    const r = await request('POST', '/api/horde/respond', { input: 'test-colony-smoke', tier: 'colony', sensitivity: 0.5 }, true);
    const pass = r.status === 200 && r.body.tier === 'colony' && r.body.defensePosture === 'SWARM';
    results.push({ name: 'POST /api/horde/respond (colony)', pass, detail: pass ? `posture=${r.body.defensePosture}` : `got posture=${r.body.defensePosture}` });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'POST /api/horde/respond (colony)', pass: false, error: e.message }); }

  // 5. Responses log (auth)
  try {
    const r = await request('GET', '/api/horde/responses?limit=5', null, true);
    const pass = r.status === 200 && Array.isArray(r.body.responses);
    results.push({ name: 'GET /api/horde/responses', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/horde/responses', pass: false, error: e.message }); }

  // 6. Clusters (auth)
  try {
    const r = await request('GET', '/api/horde/clusters', null, true);
    const pass = r.status === 200 && Array.isArray(r.body.clusters) && r.body.clusters.length === 4;
    results.push({ name: 'GET /api/horde/clusters', pass });
    if (pass) ok++;
  } catch (e) { results.push({ name: 'GET /api/horde/clusters', pass: false, error: e.message }); }

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
