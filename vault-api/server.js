/**
 * THE VAULT™ API — 81-slot quantum-backed key store.
 * Each slot maps to one block on the 9×9 Hurwitz Quaternion board.
 * Mining a block in the 3D game = requesting key release for that slot.
 *
 * Dashboard: http://localhost:5003/
 * Health:    http://localhost:5003/api/vault/health
 */
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const SLOTS = 81;
const DEFAULT_API_KEY = process.env.VAULT_API_KEY || 'vault-demo-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'vault-data.json');

// --- Persistence ---

function deriveSlotKey(slotIndex) {
  const seed = process.env.VAULT_KEY_SEED || 'SHQKD-Echo-Resonance-81';
  return crypto.createHash('sha256').update(seed + '-' + slotIndex).digest('hex');
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const store = new Map();
      for (let i = 0; i < SLOTS; i++) {
        const saved = raw.slots && raw.slots[i];
        store.set(i, {
          keyMaterial: (saved && saved.keyMaterial) || deriveSlotKey(i),
          encryptedPayload: (saved && saved.encryptedPayload) || null
        });
      }
      return { keyStore: store, auditLog: Array.isArray(raw.auditLog) ? raw.auditLog : [] };
    }
  } catch (e) {
    console.warn('  Could not load vault-data.json — starting fresh:', e.message);
  }
  const store = new Map();
  for (let i = 0; i < SLOTS; i++) store.set(i, { keyMaterial: deriveSlotKey(i), encryptedPayload: null });
  return { keyStore: store, auditLog: [] };
}

function saveData() {
  try {
    const slots = {};
    for (let i = 0; i < SLOTS; i++) slots[i] = keyStore.get(i);
    fs.writeFileSync(DATA_FILE, JSON.stringify({ slots, auditLog }, null, 2));
  } catch (e) {
    console.warn('  Could not save vault-data.json:', e.message);
  }
}

const { keyStore, auditLog } = loadData();
const startedAt = new Date().toISOString();

// --- Configs ---

const SIGNATURE_CONFIG = {
  id: 'signature',
  name: 'Key-at-zero, 144 Hurwitz moat, unlocked key moat',
  tier: 'signature',
  crownSlotIndex: 0,
  moatLayers: [
    { kind: 'hurwitz', points: 144, role: 'guard' },
    { kind: 'unlocked_key_moat', role: 'orbital' }
  ],
  slotRoles: { '0': 'crown' },
  meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
};
const configsStore = new Map();
configsStore.set('signature', JSON.parse(JSON.stringify(SIGNATURE_CONFIG)));

// --- Auth ---

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-vault-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey || apiKey !== DEFAULT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  req.apiKeyId = apiKey.slice(0, 8);
  next();
}

// --- Dashboard ---

app.get('/', (req, res) => {
  const filled = [];
  for (let i = 0; i < SLOTS; i++) {
    if (keyStore.get(i)?.encryptedPayload) filled.push(i);
  }
  const recent = auditLog.slice(-10).reverse();
  const keyPrefix = DEFAULT_API_KEY.slice(0, 8);

  const slotGrid = Array.from({ length: SLOTS }, (_, i) => {
    const hasPayload = !!keyStore.get(i)?.encryptedPayload;
    const isCrown = i === 0;
    const color = isCrown ? '#00e5ff' : hasPayload ? '#764ba2' : '#1a2a3a';
    const border = isCrown ? '2px solid #00e5ff' : hasPayload ? '1px solid #764ba2' : '1px solid #2a3a4a';
    const title = isCrown ? 'Crown — Slot 0' : hasPayload ? `Slot ${i} — payload stored` : `Slot ${i}`;
    return `<div title="${title}" style="width:18px;height:18px;background:${color};border:${border};border-radius:2px;display:inline-block;margin:1px;"></div>`;
  }).join('');

  const auditRows = recent.map(e =>
    `<tr><td style="color:#667eea;padding:2px 8px 2px 0;">${e.ts.slice(11, 19)}</td><td style="padding:2px 8px 2px 0;color:#aaa;">${e.action}</td><td style="color:#ccc;">slot ${e.slotIndex}</td></tr>`
  ).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="10">
  <title>THE VAULT™ — Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a1628; color: #c8d8e8; font-family: 'Courier New', monospace; padding: 32px; min-height: 100vh; }
    h1 { color: #00e5ff; font-size: 1.4rem; letter-spacing: 0.15em; margin-bottom: 4px; }
    .sub { color: #667eea; font-size: 0.75rem; margin-bottom: 32px; letter-spacing: 0.1em; }
    .grid { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 8px; width: fit-content; }
    .section { margin-bottom: 28px; }
    .label { color: #667eea; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
    .stat { font-size: 1.6rem; color: #fff; font-weight: bold; }
    .stat-row { display: flex; gap: 40px; margin-bottom: 24px; }
    .stat-block { }
    .stat-sub { font-size: 0.7rem; color: #667eea; margin-top: 2px; }
    table { border-collapse: collapse; font-size: 0.78rem; }
    .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.7rem; letter-spacing: 0.1em; }
    .pill-cyan { background: #00263a; color: #00e5ff; border: 1px solid #00e5ff44; }
    .pill-purple { background: #1a0a2e; color: #764ba2; border: 1px solid #764ba244; }
    .key { color: #00e5ff; background: #00263a; padding: 4px 10px; border-radius: 4px; font-size: 0.78rem; }
    .footer { color: #2a4a6a; font-size: 0.68rem; margin-top: 32px; }
    a { color: #667eea; text-decoration: none; }
    a:hover { color: #00e5ff; }
    .api-panel { background: #0d1f35; border: 1px solid #1a3a5a; border-radius: 6px; padding: 14px; }
    .api-title { font-size: 0.78rem; margin-bottom: 10px; color: #c8d8e8; }
    .api-field { margin-bottom: 8px; font-size: 0.72rem; }
    .api-field label { color: #667eea; display: block; margin-bottom: 2px; }
    .api-field input { background: #0a1628; color: #c8d8e8; border: 1px solid #1a3a5a; padding: 3px 8px; border-radius: 3px; font-family: monospace; font-size: 0.72rem; width: 120px; }
    .api-out { font-size: 0.68rem; margin-top: 10px; color: #667eea; white-space: pre-wrap; word-break: break-all; max-height: 140px; overflow-y: auto; min-height: 18px; }
    button { background: #00263a; color: #00e5ff; border: 1px solid #00e5ff44; padding: 4px 14px; border-radius: 3px; font-family: monospace; font-size: 0.72rem; cursor: pointer; margin-top: 4px; }
    button:hover { background: #003a55; }
    .method { padding: 1px 6px; border-radius: 3px; font-size: 0.65rem; margin-right: 6px; font-weight: bold; }
    .method.get { background: #0a2e1a; color: #00c853; }
    .method.post { background: #1a1a2e; color: #764ba2; }
  </style>
</head>
<body>
  <h1>THE VAULT™</h1>
  <div class="sub">QUANTUM-BACKED KEY STORE — 81 SLOTS — STEADYWATCH / QUANTUM V^</div>

  <div class="stat-row">
    <div class="stat-block">
      <div class="label">Slots</div>
      <div class="stat">${SLOTS}</div>
      <div class="stat-sub">9 × 9 Hurwitz board</div>
    </div>
    <div class="stat-block">
      <div class="label">Payloads stored</div>
      <div class="stat" style="color:${filled.length > 0 ? '#764ba2' : '#2a4a6a'}">${filled.length}</div>
      <div class="stat-sub">${SLOTS - filled.length} slots available</div>
    </div>
    <div class="stat-block">
      <div class="label">Audit entries</div>
      <div class="stat">${auditLog.length}</div>
      <div class="stat-sub">since ${startedAt.slice(0, 10)}</div>
    </div>
    <div class="stat-block">
      <div class="label">Active config</div>
      <div class="stat" style="font-size:0.9rem;color:#00e5ff;margin-top:6px;">signature</div>
      <div class="stat-sub">crown at slot 0 · 144 Hurwitz moat</div>
    </div>
  </div>

  <div class="section">
    <div class="label">Slot map &nbsp;<span class="pill pill-cyan">cyan = crown (slot 0)</span>&nbsp;<span class="pill pill-purple">purple = payload stored</span></div>
    <div class="grid">${slotGrid}</div>
    <div style="font-size:0.68rem;color:#2a4a6a;margin-top:4px;">Row-major 9×9 · slot 0 top-left · maps to game board block (bx, bz)</div>
  </div>

  <div class="section">
    <div class="label">Recent activity</div>
    ${recent.length === 0
      ? '<div style="color:#2a4a6a;font-size:0.78rem;">No activity yet — mine a block in the 3D game to trigger a key release.</div>'
      : `<table>${auditRows}</table>`}
  </div>

  <div class="section">
    <div class="label">API key</div>
    <input id="apiKey" type="text" value="${DEFAULT_API_KEY}" style="background:#00263a;color:#00e5ff;border:1px solid #00e5ff44;padding:4px 10px;border-radius:4px;font-size:0.78rem;font-family:monospace;width:420px;" />
    <span style="font-size:0.7rem;color:#2a4a6a;margin-left:12px;">Used for all authenticated requests below</span>
  </div>

  <div class="section">
    <div class="label">API Explorer</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/health</div>
        <button onclick="call('GET','/api/vault/health',null,false,'health-out')">Send</button>
        <pre id="health-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/slots</div>
        <button onclick="call('GET','/api/vault/slots',null,false,'slots-out')">Send</button>
        <pre id="slots-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method post">POST</span> /api/vault/request</div>
        <div class="api-field"><label>slotIndex (0–80)</label><input type="number" id="req-slot" value="0" min="0" max="80" /></div>
        <button onclick="call('POST','/api/vault/request',{slotIndex:+id('req-slot').value},true,'request-out')">Send</button>
        <pre id="request-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method post">POST</span> /api/vault/store</div>
        <div class="api-field"><label>slotIndex (0–80)</label><input type="number" id="store-slot" value="0" min="0" max="80" /></div>
        <div class="api-field"><label>encryptedPayload</label><input type="text" id="store-payload" value="dGVzdA==" style="width:200px;" /></div>
        <button onclick="call('POST','/api/vault/store',{slotIndex:+id('store-slot').value,encryptedPayload:id('store-payload').value},true,'store-out')">Send</button>
        <pre id="store-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/audit</div>
        <div class="api-field"><label>limit</label><input type="number" id="audit-limit" value="20" min="1" max="500" /></div>
        <button onclick="call('GET','/api/vault/audit?limit='+id('audit-limit').value,null,true,'audit-out')">Send</button>
        <pre id="audit-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/configs</div>
        <button onclick="call('GET','/api/vault/configs',null,true,'configs-out')">Send</button>
        <pre id="configs-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/configs/default</div>
        <button onclick="call('GET','/api/vault/configs/default',null,true,'config-default-out')">Send</button>
        <pre id="config-default-out" class="api-out"></pre>
      </div>

      <div class="api-panel">
        <div class="api-title"><span class="method get">GET</span> /api/vault/configs/:id</div>
        <div class="api-field"><label>id</label><input type="text" id="config-id" value="signature" /></div>
        <button onclick="call('GET','/api/vault/configs/'+id('config-id').value,null,true,'config-id-out')">Send</button>
        <pre id="config-id-out" class="api-out"></pre>
      </div>

    </div>
  </div>

  <div class="footer">Auto-refreshes every 10s · Data persisted to vault-data.json · Port ${process.env.PORT || 5003}</div>

  <script>
    function id(x) { return document.getElementById(x); }
    async function call(method, path, body, auth, outId) {
      const out = id(outId);
      out.textContent = '…';
      out.style.color = '#667eea';
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (auth) opts.headers['X-Vault-Api-Key'] = id('apiKey').value;
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(path, opts);
        const data = await r.json();
        out.textContent = JSON.stringify(data, null, 2);
        out.style.color = r.ok ? '#00e5ff' : '#ff6b6b';
      } catch(e) {
        out.textContent = 'Error: ' + e.message;
        out.style.color = '#ff6b6b';
      }
    }
  </script>
</body>
</html>`);
});

// --- API routes ---

app.get('/api/vault/health', (req, res) => {
  res.json({ status: 'ok', slots: SLOTS, service: 'THE VAULT™ API' });
});

app.get('/api/vault/slots', (req, res) => {
  const filled = [];
  for (let i = 0; i < SLOTS; i++) {
    if (keyStore.get(i)?.encryptedPayload) filled.push(i);
  }
  res.json({ slots: SLOTS, filled });
});

app.post('/api/vault/store', authMiddleware, (req, res) => {
  const { slotIndex, encryptedPayload } = req.body || {};
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= SLOTS) {
    return res.status(400).json({ error: 'Bad request', message: 'slotIndex must be 0..80' });
  }
  const slot = keyStore.get(slotIndex);
  slot.encryptedPayload = typeof encryptedPayload === 'string' ? encryptedPayload : JSON.stringify(encryptedPayload || '');
  auditLog.push({ ts: new Date().toISOString(), action: 'store', slotIndex, apiKeyId: req.apiKeyId });
  saveData();
  res.json({ ok: true, slotIndex });
});

app.post('/api/vault/request', authMiddleware, (req, res) => {
  const { slotIndex } = req.body || {};
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= SLOTS) {
    return res.status(400).json({ error: 'Bad request', message: 'slotIndex must be 0..80' });
  }
  const slot = keyStore.get(slotIndex);
  auditLog.push({ ts: new Date().toISOString(), action: 'request', slotIndex, apiKeyId: req.apiKeyId });
  saveData();
  res.json({
    ok: true,
    slotIndex,
    keyReleased: true,
    keyMaterial: slot.keyMaterial,
    hasPayload: !!slot.encryptedPayload
  });
});

app.get('/api/vault/audit', authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  res.json({ audit: auditLog.slice(-limit) });
});

// --- Configs API ---

app.get('/api/vault/configs', authMiddleware, (req, res) => {
  const list = Array.from(configsStore.values()).map(c => ({
    id: c.id, name: c.name, tier: c.tier, crownSlotIndex: c.crownSlotIndex
  }));
  res.json({ configs: list });
});

app.get('/api/vault/configs/default', authMiddleware, (req, res) => {
  const c = configsStore.get('signature');
  if (!c) return res.status(404).json({ error: 'Not found', message: 'Default config not found' });
  res.json(c);
});

app.get('/api/vault/configs/:id', authMiddleware, (req, res) => {
  const c = configsStore.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found', message: 'Config not found' });
  res.json(c);
});

app.post('/api/vault/configs', authMiddleware, (req, res) => {
  const body = req.body || {};
  const id = (body.id || 'config-' + Date.now()).toString().replace(/\s+/g, '-').toLowerCase();
  if (configsStore.has(id)) return res.status(409).json({ error: 'Conflict', message: 'Config id already exists' });
  const now = new Date().toISOString();
  const config = {
    id,
    name: body.name || 'Unnamed config',
    tier: body.tier || 'custom',
    crownSlotIndex: typeof body.crownSlotIndex === 'number' ? body.crownSlotIndex : 0,
    moatLayers: Array.isArray(body.moatLayers) ? body.moatLayers : [],
    slotRoles: typeof body.slotRoles === 'object' && body.slotRoles !== null ? body.slotRoles : {},
    meta: { createdAt: now, updatedAt: now }
  };
  configsStore.set(id, config);
  res.status(201).json(config);
});

app.patch('/api/vault/configs/:id', authMiddleware, (req, res) => {
  const c = configsStore.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found', message: 'Config not found' });
  if (req.params.id === 'signature') return res.status(403).json({ error: 'Forbidden', message: 'Cannot modify default config' });
  const body = req.body || {};
  if (body.name !== undefined) c.name = body.name;
  if (body.tier !== undefined) c.tier = body.tier;
  if (typeof body.crownSlotIndex === 'number') c.crownSlotIndex = body.crownSlotIndex;
  if (Array.isArray(body.moatLayers)) c.moatLayers = body.moatLayers;
  if (typeof body.slotRoles === 'object' && body.slotRoles !== null) c.slotRoles = body.slotRoles;
  c.meta = c.meta || {};
  c.meta.updatedAt = new Date().toISOString();
  res.json(c);
});

app.delete('/api/vault/configs/:id', authMiddleware, (req, res) => {
  if (req.params.id === 'signature') return res.status(403).json({ error: 'Forbidden', message: 'Cannot delete default config' });
  if (!configsStore.has(req.params.id)) return res.status(404).json({ error: 'Not found', message: 'Config not found' });
  configsStore.delete(req.params.id);
  res.status(204).send();
});

// --- Lattice Auth (p=5, 144 sites) ---

const { mountLatticeAuth } = require('../lattice-auth-middleware');
mountLatticeAuth(app, { serverPrime: 5 });

// --- Start ---

const port = process.env.PORT || 5003;
app.listen(port, () => {
  const filled = Array.from({ length: SLOTS }, (_, i) => keyStore.get(i)?.encryptedPayload ? 1 : 0).reduce((a, b) => a + b, 0);
  console.log('');
  console.log('  THE VAULT™ — Quantum-Backed Key Store');
  console.log('  ─────────────────────────────────────');
  console.log('  Dashboard  →  http://localhost:' + port + '/');
  console.log('  Health     →  http://localhost:' + port + '/api/vault/health');
  console.log('');
  console.log('  Slots:     ' + SLOTS + ' (9×9 Hurwitz board)');
  console.log('  Payloads:  ' + filled + ' stored');
  console.log('  API key:   ' + DEFAULT_API_KEY.slice(0, 8) + '…  (set VAULT_API_KEY env to change)');
  console.log('  Data file: ' + DATA_FILE);
  console.log('');
});
