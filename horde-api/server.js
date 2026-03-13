/**
 * HORDE API — 432-key Hurwitz quaternion swarm defense.
 * Collective consensus threat response across 4 defense clusters.
 *
 * Dashboard: http://localhost:5002/
 * Health:    http://localhost:5002/api/horde/health
 */
'use strict';

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { swarm, getClusterStats, CLUSTERS, TOTAL_KEYS, KEYS_PER_CLUSTER } = require('./horde-engine');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_API_KEY = process.env.HORDE_API_KEY || 'horde-demo-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'horde-data.json');
const startedAt = new Date().toISOString();

// --- Persistence ---

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return { responseLog: Array.isArray(d.responseLog) ? d.responseLog : [] };
    }
  } catch (e) { console.warn('  Could not load horde-data.json — starting fresh'); }
  return { responseLog: [] };
}

function saveData() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify({ responseLog }, null, 2)); }
  catch (e) { console.warn('  Could not save horde-data.json:', e.message); }
}

let { responseLog } = loadData();

// --- Auth ---

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-horde-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey || apiKey !== DEFAULT_API_KEY)
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  req.apiKeyId = apiKey.slice(0, 8);
  next();
}

// --- Dashboard ---

app.get('/', (req, res) => {
  const keyPrefix = DEFAULT_API_KEY.slice(0, 8);
  const clusterStats = getClusterStats(responseLog);
  const recent = responseLog.slice(-10).reverse();
  const totalResponses = responseLog.length;
  const criticalCount = responseLog.filter(r => r.threatLevel === 'CRITICAL' || r.threatLevel === 'HIGH').length;

  const THREAT_COLORS = { CRITICAL: '#ff2d55', HIGH: '#ff6b35', MEDIUM: '#ffcc00', LOW: '#00c853', NOMINAL: '#2a4a6a' };
  const CLUSTER_COLORS = ['#00e5ff', '#764ba2', '#00c853', '#ff6b35'];
  const POSTURE_ICONS = { SWARM: '⬡', SHIELD: '◈', TRACE: '◎', ADAPT: '◇' };

  const clusterBars = clusterStats.map((c, i) => {
    const pct = totalResponses > 0 ? Math.round((c.activations / totalResponses) * 100) : 0;
    return `<div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="color:${CLUSTER_COLORS[i]};font-size:0.75rem;letter-spacing:0.1em;">${c.name}</span>
        <span style="color:#667eea;font-size:0.7rem;">${c.direction} · ${c.activations} activations · ${c.nodes} nodes</span>
      </div>
      <div style="background:#0d1f35;border-radius:2px;height:6px;">
        <div style="background:${CLUSTER_COLORS[i]};width:${pct}%;height:6px;border-radius:2px;"></div>
      </div>
      <div style="font-size:0.65rem;color:#2a4a6a;margin-top:2px;">${c.description}</div>
    </div>`;
  }).join('');

  const auditRows = recent.map(e => {
    const c = THREAT_COLORS[e.threatLevel] || '#667eea';
    return `<tr>
      <td style="color:#667eea;padding:2px 8px 2px 0;font-size:0.7rem;">${e.ts.slice(11,19)}</td>
      <td style="padding:2px 8px 2px 0;"><span style="color:${c};font-size:0.7rem;">${e.threatLevel}</span></td>
      <td style="padding:2px 8px 2px 0;color:#00c853;font-size:0.7rem;">${e.defensePosture}</span></td>
      <td style="color:#667eea;font-size:0.7rem;">${(e.consensusScore*100).toFixed(1)}% consensus</td>
      <td style="color:#667eea;font-size:0.7rem;">${e.respondingNodes}/${e.neighborhoodSize} nodes</td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="10">
  <title>HORDE — Swarm Defense</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a1628; color: #c8d8e8; font-family: 'Courier New', monospace; padding: 32px; min-height: 100vh; }
    h1 { color: #00c853; font-size: 1.4rem; letter-spacing: 0.2em; margin-bottom: 2px; }
    .sub { color: #667eea; font-size: 0.72rem; margin-bottom: 32px; letter-spacing: 0.1em; }
    .section { margin-bottom: 28px; }
    .label { color: #667eea; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
    .stat-row { display: flex; gap: 40px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-block .stat { font-size: 1.6rem; color: #fff; font-weight: bold; }
    .stat-block .stat-sub { font-size: 0.7rem; color: #667eea; margin-top: 2px; }
    table { border-collapse: collapse; width: 100%; }
    .api-panel { background: #0d1f35; border: 1px solid #1a3a5a; border-radius: 6px; padding: 14px; }
    .api-title { font-size: 0.78rem; margin-bottom: 10px; color: #c8d8e8; }
    .api-field { margin-bottom: 8px; font-size: 0.72rem; }
    .api-field label { color: #667eea; display: block; margin-bottom: 2px; }
    .api-field input, .api-field select, .api-field textarea { background: #0a1628; color: #c8d8e8; border: 1px solid #1a3a5a; padding: 3px 8px; border-radius: 3px; font-family: monospace; font-size: 0.72rem; }
    .api-field input, .api-field select { width: 200px; }
    .api-field textarea { width: 100%; height: 60px; resize: vertical; }
    .api-out { font-size: 0.68rem; margin-top: 10px; color: #667eea; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; min-height: 18px; }
    button { background: #0a2e1a; color: #00c853; border: 1px solid #00c85344; padding: 4px 14px; border-radius: 3px; font-family: monospace; font-size: 0.72rem; cursor: pointer; margin-top: 4px; }
    button:hover { background: #0f3d22; }
    .method { padding: 1px 6px; border-radius: 3px; font-size: 0.65rem; margin-right: 6px; font-weight: bold; }
    .get { background: #0a2e1a; color: #00c853; }
    .post { background: #0a2a0a; color: #00e5ff; }
    .footer { color: #2a4a6a; font-size: 0.68rem; margin-top: 32px; }
  </style>
</head>
<body>
  <h1>HORDE</h1>
  <div class="sub">432-KEY HURWITZ SWARM DEFENSE — COLLECTIVE CONSENSUS RESPONSE — STEADYWATCH / QUANTUM V^</div>

  <div class="stat-row">
    <div class="stat-block">
      <div class="label">Swarm Nodes</div>
      <div class="stat" style="color:#00c853;">${TOTAL_KEYS}</div>
      <div class="stat-sub">4 clusters × ${KEYS_PER_CLUSTER} nodes · p=17 Hurwitz</div>
    </div>
    <div class="stat-block">
      <div class="label">Total Responses</div>
      <div class="stat">${totalResponses}</div>
      <div class="stat-sub">since ${startedAt.slice(0,10)}</div>
    </div>
    <div class="stat-block">
      <div class="label">Critical / High</div>
      <div class="stat" style="color:${criticalCount > 0 ? '#ff2d55' : '#2a4a6a'}">${criticalCount}</div>
      <div class="stat-sub">${totalResponses > 0 ? ((criticalCount/totalResponses)*100).toFixed(1) : 0}% of all responses</div>
    </div>
    <div class="stat-block">
      <div class="label">Active Tier</div>
      <div class="stat" style="font-size:0.9rem;color:#00c853;margin-top:6px;">SWARM</div>
      <div class="stat-sub">full 4-cluster consensus</div>
    </div>
  </div>

  <div class="section">
    <div class="label">Cluster Activity</div>
    ${clusterBars}
  </div>

  <div class="section">
    <div class="label">Recent Responses</div>
    ${recent.length === 0
      ? '<div style="color:#2a4a6a;font-size:0.78rem;">No responses yet — POST to /api/horde/respond to activate swarm defense.</div>'
      : `<table>${auditRows}</table>`}
  </div>

  <div class="section">
    <div class="label">API key</div>
    <input id="apiKey" type="text" value="${DEFAULT_API_KEY}" style="background:#0a2e1a;color:#00c853;border:1px solid #00c85344;padding:4px 10px;border-radius:4px;font-size:0.78rem;font-family:monospace;width:420px;" />
  </div>

  <div class="section">
    <div class="label">API Explorer</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/horde/health</div>
        <button onclick="call('GET','/api/horde/health',null,false,'health-out')">Send</button>
        <pre id="health-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/horde/status</div>
        <button onclick="call('GET','/api/horde/status',null,true,'status-out')">Send</button>
        <pre id="status-out" class="api-out"></pre>
      </div>

      <div class="api-panel" style="grid-column:1/-1;">
        <div class="api-title"><span class="method post">POST</span> /api/horde/respond — Submit threat data for swarm consensus defense</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="api-field">
            <label>input (threat data, event, signature)</label>
            <textarea id="respond-input">suspicious outbound traffic 450MB 3:00AM unusual destination</textarea>
          </div>
          <div class="api-field">
            <label>tier</label>
            <select id="respond-tier">
              <option value="swarm">swarm (full 4-cluster)</option>
              <option value="colony">colony (cluster 0 only)</option>
            </select>
          </div>
          <div class="api-field">
            <label>sensitivity (0.0 – 1.0)</label>
            <input type="number" id="respond-sensitivity" value="0.5" min="0" max="1" step="0.1" style="width:100px;" />
          </div>
        </div>
        <button onclick="call('POST','/api/horde/respond',{input:id('respond-input').value,tier:id('respond-tier').value,sensitivity:+id('respond-sensitivity').value},true,'respond-out')">Activate Swarm</button>
        <pre id="respond-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/horde/responses</div>
        <div class="api-field"><label>limit</label><input type="number" id="responses-limit" value="20" min="1" max="500" style="width:80px;" /></div>
        <button onclick="call('GET','/api/horde/responses?limit='+id('responses-limit').value,null,true,'responses-out')">Send</button>
        <pre id="responses-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/horde/clusters</div>
        <button onclick="call('GET','/api/horde/clusters',null,true,'clusters-out')">Send</button>
        <pre id="clusters-out" class="api-out"></pre>
      </div>

    </div>
  </div>

  <div class="footer">Auto-refreshes every 10s · Data persisted to horde-data.json · Port ${process.env.PORT || 5002}</div>

  <script>
    function id(x) { return document.getElementById(x); }
    async function call(method, path, body, auth, outId) {
      const out = id(outId);
      out.textContent = '…';
      out.style.color = '#667eea';
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (auth) opts.headers['X-Horde-Api-Key'] = id('apiKey').value;
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(path, opts);
        const data = await r.json();
        out.textContent = JSON.stringify(data, null, 2);
        out.style.color = r.ok ? '#00c853' : '#ffcc00';
      } catch(e) {
        out.textContent = 'Error: ' + e.message;
        out.style.color = '#ffcc00';
      }
    }
  </script>
</body>
</html>`);
});

// --- API routes ---

app.get('/api/horde/health', (req, res) => {
  res.json({ status: 'ok', nodes: TOTAL_KEYS, clusters: 4, service: 'HORDE Swarm Defense API' });
});

app.get('/api/horde/status', authMiddleware, (req, res) => {
  res.json({
    status: 'active',
    nodes: TOTAL_KEYS,
    nodesPerCluster: KEYS_PER_CLUSTER,
    clusters: getClusterStats(responseLog),
    totalResponses: responseLog.length,
    upSince: startedAt
  });
});

app.post('/api/horde/respond', authMiddleware, (req, res) => {
  const { input, tier, sensitivity } = req.body || {};
  if (input === undefined || input === null || String(input).trim() === '') {
    return res.status(400).json({ error: 'Bad request', message: 'input is required' });
  }
  const result = swarm(input, { tier, sensitivity });
  responseLog.push({ ...result, apiKeyId: req.apiKeyId });
  saveData();
  res.json(result);
});

app.get('/api/horde/responses', authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const level = req.query.level;
  let log = responseLog.slice(-limit * 2);
  if (level) log = log.filter(r => r.threatLevel === level.toUpperCase());
  res.json({ responses: log.slice(-limit), total: responseLog.length });
});

app.get('/api/horde/clusters', authMiddleware, (req, res) => {
  res.json({ clusters: getClusterStats(responseLog) });
});

// --- Lattice Auth (p=17, 432 sites) ---

const { mountLatticeAuth } = require('../lattice-auth-middleware');
mountLatticeAuth(app, { serverPrime: 17 });

// --- Start ---

const port = process.env.PORT || 5002;
app.listen(port, () => {
  console.log('');
  console.log('  HORDE — Hurwitz Swarm Defense');
  console.log('  ─────────────────────────────────────');
  console.log('  Dashboard  →  http://localhost:' + port + '/');
  console.log('  Health     →  http://localhost:' + port + '/api/horde/health');
  console.log('');
  console.log('  Nodes:     ' + TOTAL_KEYS + ' (4 clusters × ' + KEYS_PER_CLUSTER + ' · p=17 Hurwitz)');
  console.log('  Postures:  SWARM · SHIELD · TRACE · ADAPT');
  console.log('  API key:   ' + DEFAULT_API_KEY.slice(0, 8) + '…  (set HORDE_API_KEY env to change)');
  console.log('');
});
