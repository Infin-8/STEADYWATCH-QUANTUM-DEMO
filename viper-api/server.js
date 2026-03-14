/**
 * VIPER API — 336-key Hurwitz quaternion threat detection.
 * Classifies input signatures against 4 kill chain vectors.
 *
 * Dashboard: http://localhost:5001/
 * Health:    http://localhost:5001/api/viper/health
 */
'use strict';

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { scan, getArmStats, KEY_MATRIX, ARM_VECTORS, TOTAL_KEYS } = require('./viper-engine');

// Geometric arm counts (unequal — reflects real F4 density per quadrant)
const ARM_KEY_COUNTS = [0, 1, 2, 3].map(i => KEY_MATRIX.filter(k => k.arm === i).length);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_API_KEY = process.env.VIPER_API_KEY || 'viper-demo-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'viper-data.json');
const startedAt = new Date().toISOString();

// --- Persistence ---

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return { alertLog: Array.isArray(d.alertLog) ? d.alertLog : [] };
    }
  } catch (e) {
    console.warn('  Could not load viper-data.json — starting fresh');
  }
  return { alertLog: [] };
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ alertLog }, null, 2));
  } catch (e) {
    console.warn('  Could not save viper-data.json:', e.message);
  }
}

let { alertLog } = loadData();

// --- Auth ---

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-viper-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey || apiKey !== DEFAULT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  req.apiKeyId = apiKey.slice(0, 8);
  next();
}

// --- Dashboard ---

app.get('/', (req, res) => {
  const keyPrefix = DEFAULT_API_KEY.slice(0, 8);
  const armStats = getArmStats(alertLog);
  const recent = alertLog.slice(-10).reverse();
  const totalDetections = alertLog.length;
  const criticalCount = alertLog.filter(a => a.threatLevel === 'CRITICAL' || a.threatLevel === 'HIGH').length;

  const THREAT_COLORS = { CRITICAL: '#ff2d55', HIGH: '#ff6b35', MEDIUM: '#ffcc00', LOW: '#00e5ff', NOMINAL: '#2a4a6a' };
  const ARM_COLORS = ['#00e5ff', '#764ba2', '#00c853', '#ff6b35'];

  const armBars = armStats.map((a, i) => {
    const pct = totalDetections > 0 ? Math.round((a.detections / totalDetections) * 100) : 0;
    return `<div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="color:${ARM_COLORS[i]};font-size:0.75rem;letter-spacing:0.1em;">${a.vector}</span>
        <span style="color:#667eea;font-size:0.7rem;">${a.direction} · ${a.detections} detections</span>
      </div>
      <div style="background:#0d1f35;border-radius:2px;height:6px;">
        <div style="background:${ARM_COLORS[i]};width:${pct}%;height:6px;border-radius:2px;transition:width 0.3s;"></div>
      </div>
      <div style="font-size:0.65rem;color:#2a4a6a;margin-top:2px;">${a.description}</div>
    </div>`;
  }).join('');

  const auditRows = recent.map(e => {
    const c = THREAT_COLORS[e.threatLevel] || '#667eea';
    return `<tr>
      <td style="color:#667eea;padding:2px 8px 2px 0;font-size:0.7rem;">${e.ts.slice(11,19)}</td>
      <td style="padding:2px 8px 2px 0;"><span style="color:${c};font-size:0.7rem;">${e.threatLevel}</span></td>
      <td style="padding:2px 8px 2px 0;color:#00e5ff;font-size:0.7rem;">${e.vector}</td>
      <td style="color:#667eea;font-size:0.7rem;">${(e.confidence*100).toFixed(1)}%</td>
      <td style="color:#2a6a4a;font-size:0.65rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.inputHash ? e.inputHash.slice(0,16)+'…' : ''}</td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="10">
  <title>VIPER — Threat Detection</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a1628; color: #c8d8e8; font-family: 'Courier New', monospace; padding: 32px; min-height: 100vh; }
    h1 { color: #ff2d55; font-size: 1.4rem; letter-spacing: 0.2em; margin-bottom: 2px; }
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
    .api-out { font-size: 0.68rem; margin-top: 10px; color: #667eea; white-space: pre-wrap; word-break: break-all; max-height: 180px; overflow-y: auto; min-height: 18px; }
    button { background: #1a0a1a; color: #ff2d55; border: 1px solid #ff2d5544; padding: 4px 14px; border-radius: 3px; font-family: monospace; font-size: 0.72rem; cursor: pointer; margin-top: 4px; }
    button:hover { background: #2a0a1a; }
    .method { padding: 1px 6px; border-radius: 3px; font-size: 0.65rem; margin-right: 6px; font-weight: bold; }
    .get { background: #0a2e1a; color: #00c853; }
    .post { background: #1a0a0a; color: #ff2d55; }
    .footer { color: #2a4a6a; font-size: 0.68rem; margin-top: 32px; }
    a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <h1>VIPER</h1>
  <div class="sub">336-KEY HURWITZ THREAT DETECTION — KILL CHAIN VECTOR CLASSIFICATION — STEADYWATCH / QUANTUM V^</div>

  <div class="stat-row">
    <div class="stat-block">
      <div class="label">Detection Nodes</div>
      <div class="stat" style="color:#ff2d55;">${TOTAL_KEYS}</div>
      <div class="stat-sub">336 keys · 4 geometric arms · p=13 Hurwitz</div>
    </div>
    <div class="stat-block">
      <div class="label">Total Detections</div>
      <div class="stat">${totalDetections}</div>
      <div class="stat-sub">since ${startedAt.slice(0,10)}</div>
    </div>
    <div class="stat-block">
      <div class="label">Critical / High</div>
      <div class="stat" style="color:${criticalCount > 0 ? '#ff2d55' : '#2a4a6a'}">${criticalCount}</div>
      <div class="stat-sub">${totalDetections > 0 ? ((criticalCount/totalDetections)*100).toFixed(1) : 0}% of all scans</div>
    </div>
    <div class="stat-block">
      <div class="label">Active Tier</div>
      <div class="stat" style="font-size:0.9rem;color:#ff2d55;margin-top:6px;">STRIKE</div>
      <div class="stat-sub">full 4-arm coverage</div>
    </div>
  </div>

  <div class="section">
    <div class="label">Vector Activity</div>
    ${armBars}
  </div>

  <div class="section">
    <div class="label">Recent Detections</div>
    ${recent.length === 0
      ? '<div style="color:#2a4a6a;font-size:0.78rem;">No scans yet — POST to /api/viper/scan to begin threat detection.</div>'
      : `<table>${auditRows}</table>`}
  </div>

  <div class="section">
    <div class="label">API key</div>
    <input id="apiKey" type="text" value="${DEFAULT_API_KEY}" style="background:#00263a;color:#ff2d55;border:1px solid #ff2d5544;padding:4px 10px;border-radius:4px;font-size:0.78rem;font-family:monospace;width:420px;" />
    <span style="font-size:0.7rem;color:#2a4a6a;margin-left:12px;">Used for all authenticated requests below</span>
  </div>

  <div class="section">
    <div class="label">API Explorer</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/viper/health</div>
        <button onclick="call('GET','/api/viper/health',null,false,'health-out')">Send</button>
        <pre id="health-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/viper/status</div>
        <button onclick="call('GET','/api/viper/status',null,true,'status-out')">Send</button>
        <pre id="status-out" class="api-out"></pre>
      </div>

      <div class="api-panel" style="grid-column:1/-1;">
        <div class="api-title"><span class="method post">POST</span> /api/viper/scan — Submit any data for threat classification</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="api-field">
            <label>input (any string, IP, hash, event)</label>
            <textarea id="scan-input">192.168.1.100 GET /admin/config HTTP/1.1</textarea>
          </div>
          <div class="api-field">
            <label>tier</label>
            <select id="scan-tier"><option value="strike">strike (4 arms, full)</option><option value="scout">scout (1 arm, RECON only)</option></select>
          </div>
          <div class="api-field">
            <label>sensitivity (0.0 – 1.0)</label>
            <input type="number" id="scan-sensitivity" value="0.5" min="0" max="1" step="0.1" style="width:100px;" />
          </div>
        </div>
        <button onclick="call('POST','/api/viper/scan',{input:id('scan-input').value,tier:id('scan-tier').value,sensitivity:+id('scan-sensitivity').value},true,'scan-out')">Scan</button>
        <pre id="scan-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/viper/alerts</div>
        <div class="api-field"><label>limit</label><input type="number" id="alerts-limit" value="20" min="1" max="500" style="width:80px;" /></div>
        <button onclick="call('GET','/api/viper/alerts?limit='+id('alerts-limit').value,null,true,'alerts-out')">Send</button>
        <pre id="alerts-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/viper/vectors</div>
        <button onclick="call('GET','/api/viper/vectors',null,true,'vectors-out')">Send</button>
        <pre id="vectors-out" class="api-out"></pre>
      </div>

    </div>
  </div>

  <div class="section">
    <div class="label">Lattice Fingerprint &nbsp;<span style="color:#2a4a6a;font-size:0.68rem;">p=13 · 336 F4 SITES · VIPER IDENTITY · 4 arms × 84 detection keys · brightness = arm activity</span></div>
    <div style="display:flex;align-items:flex-start;gap:24px;">
      <canvas id="fp-canvas" width="280" height="280" style="border:1px solid #1a3a2a;border-radius:4px;background:#060e0a;"></canvas>
      <div style="font-size:0.72rem;color:#667eea;line-height:1.8;">
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff2d55;margin-right:6px;"></span>Arm 0 — Initial Access / Recon</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff9500;margin-right:6px;"></span>Arm 1 — Lateral Movement</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#667eea;margin-right:6px;"></span>Arm 2 — Exfiltration</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#00e5ff;margin-right:6px;"></span>Arm 3 — Command &amp; Control</div>
        <div style="margin-top:12px;color:#2a4a6a;font-size:0.68rem;">
          VIPER's structural identity.<br>336 detection keys arranged<br>in the F4 lattice — the same<br>pattern as the 336-mode<br>Fingerprint View in the game.<br>Brightness shows which<br>threat vectors are active.
        </div>
        <div id="fp-hash" style="margin-top:12px;font-size:0.65rem;color:#1a3a2a;word-break:break-all;max-width:180px;"></div>
      </div>
    </div>
  </div>

  <div class="footer">Auto-refreshes every 10s · Data persisted to viper-data.json · Port ${process.env.PORT || 5001}</div>

  <script>
    function id(x) { return document.getElementById(x); }

    // --- Lattice Fingerprint Canvas ---
    (function initFingerprintCanvas() {
      const canvas = document.getElementById('fp-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height, CX = W / 2, CY = H / 2;
      const ARM_COLORS = ['#ff2d55', '#ff9500', '#667eea', '#00e5ff'];
      let sites = [], armActivity = [0, 0, 0, 0], maxActivity = 1, animFrame, t = 0;

      function project(site) {
        return { x: CX + site.x * 36, y: CY + site.y * 36 };
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = '#0a1f0d'; ctx.lineWidth = 0.5;
        [40, 80, 120].forEach(r => {
          ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
        });
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
        for (let i = 0; i < sites.length; i++) {
          const s = sites[i];
          const p = project(s);
          const base = ARM_COLORS[s.arm] || '#667eea';
          const activity = armActivity[s.arm] || 0;
          const brightness = 0.18 + 0.82 * (activity / maxActivity) * (0.7 + pulse * 0.3);
          ctx.globalAlpha = brightness;
          if (brightness > 0.5) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
            g.addColorStop(0, base + '44'); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = g; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = base; ctx.fill();
        }
        ctx.globalAlpha = 1;
        t++;
        animFrame = requestAnimationFrame(draw);
      }

      async function load() {
        try {
          const apiKey = id('apiKey') ? id('apiKey').value : '';
          const [sitesRes, vectorsRes] = await Promise.all([
            fetch('/auth/lattice-sites'),
            fetch('/api/viper/vectors', { headers: { 'X-Viper-Api-Key': apiKey } })
          ]);
          const sitesData = await sitesRes.json();
          sites = sitesData.sites || [];
          if (vectorsRes.ok) {
            const vData = await vectorsRes.json();
            (vData.vectors || []).forEach(v => { armActivity[v.arm] = v.detections || 0; });
            maxActivity = Math.max(...armActivity, 1);
          }
          const hashEl = document.getElementById('fp-hash');
          if (hashEl && sitesData.hash) hashEl.textContent = 'ID: ' + sitesData.hash.slice(0, 24) + '…';
          if (animFrame) cancelAnimationFrame(animFrame);
          draw();
        } catch (e) { console.warn('Fingerprint canvas load error:', e); }
      }
      load();
    })();

    async function call(method, path, body, auth, outId) {
      const out = id(outId);
      out.textContent = '…';
      out.style.color = '#667eea';
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (auth) opts.headers['X-Viper-Api-Key'] = id('apiKey').value;
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(path, opts);
        const data = await r.json();
        out.textContent = JSON.stringify(data, null, 2);
        out.style.color = r.ok ? '#ff2d55' : '#ffcc00';
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

app.get('/api/viper/health', (req, res) => {
  res.json({ status: 'ok', keys: TOTAL_KEYS, arms: 4, service: 'VIPER Threat Detection API' });
});

app.get('/api/viper/status', authMiddleware, (req, res) => {
  res.json({
    status: 'active',
    keys: TOTAL_KEYS,
    armKeyCounts: ARM_KEY_COUNTS,
    arms: getArmStats(alertLog),
    totalDetections: alertLog.length,
    upSince: startedAt
  });
});

app.post('/api/viper/scan', authMiddleware, (req, res) => {
  const { input, tier, sensitivity } = req.body || {};
  if (input === undefined || input === null || String(input).trim() === '') {
    return res.status(400).json({ error: 'Bad request', message: 'input is required' });
  }
  const result = scan(input, { tier, sensitivity });
  alertLog.push({ ...result, apiKeyId: req.apiKeyId });
  saveData();
  res.json(result);
});

app.get('/api/viper/alerts', authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const level = req.query.level;
  let log = alertLog.slice(-limit * 2);
  if (level) log = log.filter(a => a.threatLevel === level.toUpperCase());
  res.json({ alerts: log.slice(-limit), total: alertLog.length });
});

app.get('/api/viper/vectors', authMiddleware, (req, res) => {
  res.json({ vectors: getArmStats(alertLog) });
});

app.get('/api/viper/key-lattice-map', authMiddleware, (req, res) => {
  const armCounts = ARM_VECTORS.map(v => ({
    arm: v.index,
    vector: v.name,
    direction: v.direction,
    count: KEY_MATRIX.filter(k => k.arm === v.index).length
  }));
  res.json({
    prime: 13,
    total: TOTAL_KEYS,
    arms: armCounts,
    keyMap: KEY_MATRIX.map(k => ({
      index: k.index,
      arm: k.arm,
      vector: k.vector.name,
      quaternion: k.quaternion,
      projectedX: k.projectedX,
      projectedY: k.projectedY
    }))
  });
});

// --- Lattice Auth (p=13, 336 sites) ---

const { mountLatticeAuth } = require('../lattice-auth-middleware');
mountLatticeAuth(app, { serverPrime: 13 });

// --- Start ---

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log('');
  console.log('  VIPER — Hurwitz Threat Detection');
  console.log('  ─────────────────────────────────────');
  console.log('  Dashboard  →  http://localhost:' + port + '/');
  console.log('  Health     →  http://localhost:' + port + '/api/viper/health');
  console.log('');
  console.log('  Keys:      ' + TOTAL_KEYS + ' p=13 Hurwitz · arms ' + ARM_KEY_COUNTS.join('/') + ' (geometric)');
  console.log('  Vectors:   RECON · BREACH · LATERAL · EXFIL');
  console.log('  API key:   ' + DEFAULT_API_KEY.slice(0, 8) + '…  (set VIPER_API_KEY env to change)');
  console.log('');
});
