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

// --- Slot-to-Lattice Geometric Binding (computed at startup, before key derivation) ---
// Each of the 81 vault slots maps to its nearest F4 node by Euclidean distance in
// normalized 2D projected space. Grid: (col-4)/4, (row-4)/4 → [-1,1].
// F4: stereographic projection (x=a*scale, y=c*scale) normalized by max extent.

const VAULT_PRIME = 5;
const { generateF4Shell } = require('../lattice-auth-middleware');

const SLOT_LATTICE_MAP = (function computeBinding() {
  const f4 = generateF4Shell(VAULT_PRIME);
  const projected = f4.map((q, idx) => {
    const [a, b, c, d] = q;
    const scale = 1.0 / (1 + Math.abs(d) * 0.1);
    return { idx, x: a * scale, y: c * scale, a, b, c, d };
  });
  let maxExtent = 0;
  for (const s of projected) {
    const r = Math.sqrt(s.x * s.x + s.y * s.y);
    if (r > maxExtent) maxExtent = r;
  }
  if (maxExtent === 0) maxExtent = 1;
  return Array.from({ length: SLOTS }, (_, i) => {
    const col = i % 9, row = Math.floor(i / 9);
    const gx = (col - 4) / 4.0;
    const gy = (row - 4) / 4.0;
    let nearest = null, minDist = Infinity;
    for (const s of projected) {
      const nx = s.x / maxExtent, ny = s.y / maxExtent;
      const dist = Math.sqrt((gx - nx) ** 2 + (gy - ny) ** 2);
      if (dist < minDist) { minDist = dist; nearest = s; }
    }
    return {
      slotIndex: i,
      gridRow: row, gridCol: col,
      latticeNodeIndex: nearest.idx,
      latticeCoords: { a: nearest.a, b: nearest.b, c: nearest.c, d: nearest.d },
      projectedX: nearest.x, projectedY: nearest.y,
      distance: +minDist.toFixed(6)
    };
  });
})();

const NODE_TO_SLOTS = new Map();
for (const b of SLOT_LATTICE_MAP) {
  if (!NODE_TO_SLOTS.has(b.latticeNodeIndex)) NODE_TO_SLOTS.set(b.latticeNodeIndex, []);
  NODE_TO_SLOTS.get(b.latticeNodeIndex).push(b.slotIndex);
}

// --- Persistence ---

function deriveSlotKey(slotIndex) {
  const seed = process.env.VAULT_KEY_SEED || 'SHQKD-Echo-Resonance-81';
  const b = SLOT_LATTICE_MAP[slotIndex];
  const latticeAddr = b
    ? b.latticeCoords.a.toFixed(4) + ',' + b.latticeCoords.b.toFixed(4) + ','
      + b.latticeCoords.c.toFixed(4) + ',' + b.latticeCoords.d.toFixed(4)
    : '';
  return crypto.createHash('sha256').update(seed + '-' + slotIndex + '-' + latticeAddr).digest('hex');
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
    <div class="label">Echo Phase &nbsp;<span style="color:#2a4a6a;font-size:0.68rem;">HARMONIC SYNC VIA UNSYNC · 4-satellite fusion · UTC clock · φ=1.618… · 10s cycle · inner ring = Tesla 3·6·9</span></div>
    <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start;">
      <div style="flex-shrink:0;">
        <canvas id="echo-wheel" width="340" height="340" style="border:1px solid #1a3a5a;border-radius:4px 4px 0 0;background:#060e1a;display:block;"></canvas>
        <canvas id="echo-wave"  width="340" height="55"  style="border:1px solid #0d2040;border-top:none;border-radius:0 0 4px 4px;background:#060e1a;display:block;"></canvas>
        <div style="font-size:0.62rem;color:#1a3a5a;text-align:center;margin-top:3px;font-family:monospace;">phase history · <span style="color:#a855f7;">⊕ fused</span> · <span style="color:#2a4a6a;">master</span> · white flash = wrap event</div>
      </div>
      <div style="flex:1;min-width:220px;">
        <div id="echo-phase-readout"></div>
        <div style="margin-top:14px;">
          <div class="label" style="margin-bottom:6px;">Tesla 3·6·9 harmonics</div>
          <div id="echo-tesla-readout"></div>
        </div>
        <div id="echo-fusion-eq" style="margin-top:14px;"></div>
        <div id="echo-singularity" style="margin-top:8px;min-height:18px;"></div>
        <div id="echo-wrap-info" style="margin-top:4px;"></div>
        <div style="margin-top:14px;color:#2a4a6a;font-size:0.68rem;line-height:1.9;">
          L/R orbit ±φ×0.1 from master &nbsp;·&nbsp; T/B track master.<br>
          When L wraps past 0, fusion becomes non-trivial.<br>
          The unsync IS the sync — interference IS the key.
          <div style="margin-top:6px;color:#1a3a5a;">Seed: SHQKD-Echo-Resonance-81 → 81 slot keys</div>
        </div>
      </div>
    </div>
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

  <div class="section">
    <div class="label">Lattice Fingerprint &nbsp;<span style="color:#2a4a6a;font-size:0.68rem;">p=5 · 144 F4 SITES · VAULT IDENTITY · each of 81 slots bound to nearest F4 node by geometry · unbound nodes = moat</span></div>
    <div style="display:flex;align-items:flex-start;gap:24px;">
      <canvas id="fp-canvas" width="280" height="280" style="border:1px solid #1a3a5a;border-radius:4px;background:#060e1a;"></canvas>
      <div style="font-size:0.72rem;color:#667eea;line-height:1.8;">
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#00e5ff;margin-right:6px;"></span>Crown — slot 0 (key zero)</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#764ba2;margin-right:6px;"></span>Slot with payload stored</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1a2a3a;border:1px solid #2a4a6a;margin-right:6px;"></span>Empty vault slot (0–80)</div>
        <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0d1f35;border:1px dashed #1a3a5a;margin-right:6px;"></span>Hurwitz moat (sites 81–143)</div>
        <div style="margin-top:12px;color:#2a4a6a;font-size:0.68rem;">
          Each slot bound to its nearest<br>F4 node by Euclidean distance<br>in the projected plane. Moat =<br>F4 nodes with no bound slot.<br>Geometry is the address.
        </div>
        <div id="fp-hash" style="margin-top:12px;font-size:0.65rem;color:#1a3a5a;word-break:break-all;max-width:180px;"></div>
      </div>
    </div>
  </div>

  <div class="footer">Auto-refreshes every 10s · Data persisted to vault-data.json · Port ${process.env.PORT || 5003}</div>

  <script>
    function id(x) { return document.getElementById(x); }

    // --- Lattice Fingerprint Canvas ---
    (function initFingerprintCanvas() {
      const canvas = document.getElementById('fp-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height, CX = W / 2, CY = H / 2;
      let sites = [], filledSlots = new Set(), animFrame, t = 0;

      function project(site) {
        return { x: CX + site.x * 52, y: CY + site.y * 52 };
      }

      function hexAlpha(hex, a) {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return 'rgba('+r+','+g+','+b+','+a+')';
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        // Subtle grid rings for depth
        ctx.strokeStyle = '#0d1f35'; ctx.lineWidth = 0.5;
        [40, 80, 120].forEach(r => {
          ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
        });
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
        for (let i = 0; i < sites.length; i++) {
          const s = sites[i];
          const p = project(s);
          // Geometric binding: what slots are bound to this F4 node?
          const boundSlots = nodeToSlots.get(i) || [];
          const isVaultNode = boundSlots.length > 0;
          const isCrown = boundSlots.includes(0);
          const isFilled = isVaultNode && boundSlots.some(function(si) { return filledSlots.has(si); });
          const isMoat = !isVaultNode;
          let color, r, glow = false;
          if (isCrown) {
            color = '#00e5ff'; r = 4.5; glow = true;
          } else if (isMoat) {
            color = '#0d2a3a'; r = 1.8;
          } else if (isFilled) {
            color = '#764ba2'; r = 3.5; glow = true;
          } else {
            // vault slot, empty — subtle size hint for multi-bound nodes
            color = '#1a2a3a'; r = boundSlots.length > 1 ? 3.2 : 2.5;
          }
          if (glow) {
            const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            gr.addColorStop(0, hexAlpha(color, 0.35));
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = gr; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
          if (isMoat) {
            ctx.strokeStyle = '#1a3a5a'; ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
        t++;
        animFrame = requestAnimationFrame(draw);
      }

      // nodeToSlots: F4 node index → array of bound slot indices
      var nodeToSlots = new Map();

      async function load() {
        try {
          const [sitesRes, slotsRes, bindingRes] = await Promise.all([
            fetch('/auth/lattice-sites'),
            fetch('/api/vault/slots'),
            fetch('/api/vault/slot-lattice-map')
          ]);
          const sitesData = await sitesRes.json();
          const slotsData = await slotsRes.json();
          const bindingData = await bindingRes.json();
          sites = sitesData.sites || [];
          filledSlots = new Set();
          (slotsData.filled || []).forEach(function(i) { filledSlots.add(i); });
          // Build geometric node→slots map
          nodeToSlots = new Map();
          if (bindingData.binding) {
            bindingData.binding.forEach(function(b) {
              if (!nodeToSlots.has(b.latticeNodeIndex)) nodeToSlots.set(b.latticeNodeIndex, []);
              nodeToSlots.get(b.latticeNodeIndex).push(b.slotIndex);
            });
          }
          const hashEl = document.getElementById('fp-hash');
          if (hashEl && sitesData.hash) {
            hashEl.textContent = 'ID: ' + sitesData.hash.slice(0, 24) + '…'
              + '\n' + (bindingData.uniqueNodes || 0) + ' unique F4 nodes bound to 81 slots';
          }
          if (animFrame) cancelAnimationFrame(animFrame);
          draw();
        } catch (e) { console.warn('Fingerprint canvas load error:', e); }
      }
      load();
    })();

    // --- Live Echo Phase Display (v2) ---
    (function initEchoPhase() {
      var wheel = document.getElementById('echo-wheel');
      var wave  = document.getElementById('echo-wave');
      if (!wheel) return;
      var wctx = wheel.getContext('2d');
      var vctx = wave ? wave.getContext('2d') : null;
      var WW = 340, WH = 340, WCX = 170, WCY = 170, RING = 130, IRING = 60;
      var PHI = 1.618033988749895, FACTOR = 0.1, DURATION = 10.0;
      var SAT_RGB = { master:'200,216,232', left:'255,107,107', right:'0,229,255', top:'255,204,0', fused:'168,85,247' };
      var SAT_HEX = { master:'#c8d8e8',    left:'#ff6b6b',     right:'#00e5ff',   top:'#ffcc00',   fused:'#a855f7'   };
      var TESLA   = [[3,'#00c853','0,200,83'],[6,'#667eea','102,126,234'],[9,'#ff9500','255,149,0']];
      var wfMaster = [], wfFused = [], wrapMarkers = [];
      var wrapCount = 0, prevMaster = -1;

      function calc() {
        var utc = Date.now() / 1000;
        var master = (utc / DURATION) % 1.0;
        var left   = ((master - FACTOR * PHI) % 1.0 + 1.0) % 1.0;
        var right  = (master + FACTOR * PHI) % 1.0;
        var top    = master;
        var fused  = (left + right + top + top) / 4.0;
        return { master:master, left:left, right:right, top:top, fused:fused };
      }

      function p2xy(phase, r) {
        var a = phase * 2 * Math.PI - Math.PI / 2;
        return { x: WCX + r * Math.cos(a), y: WCY + r * Math.sin(a) };
      }

      function dot(phase, r, dotR, rgb, alpha) {
        var p = p2xy(phase, r);
        var g = wctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dotR * 4);
        g.addColorStop(0, 'rgba(' + rgb + ',' + (alpha * 0.55) + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        wctx.beginPath(); wctx.arc(p.x, p.y, dotR * 4, 0, Math.PI * 2);
        wctx.fillStyle = g; wctx.fill();
        wctx.beginPath(); wctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
        wctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')'; wctx.fill();
      }

      function drawWheel(phases) {
        // Persistence fade — organic trail effect
        wctx.fillStyle = 'rgba(6,14,26,0.80)';
        wctx.fillRect(0, 0, WW, WH);

        // Satellite dots (fade creates trails automatically)
        dot(phases.master, RING,        6,   SAT_RGB.master, 1.0);
        dot(phases.left,   RING,        5,   SAT_RGB.left,   0.95);
        dot(phases.right,  RING,        5,   SAT_RGB.right,  0.95);
        dot(phases.top,    RING * 0.88, 4.5, SAT_RGB.top,    0.85);
        dot(phases.fused,  RING * 0.76, 7,   SAT_RGB.fused,  1.0);

        // Tesla harmonic dots — inner ring
        for (var ti = 0; ti < TESLA.length; ti++) {
          var h = TESLA[ti];
          dot((phases.master * h[0]) % 1.0, IRING, 2.5, h[2], 0.75);
        }

        // === Static UI — redrawn each frame on top of faded trails ===

        // Rings
        wctx.strokeStyle = '#0d2040'; wctx.lineWidth = 1.2;
        wctx.beginPath(); wctx.arc(WCX, WCY, RING, 0, Math.PI * 2); wctx.stroke();
        wctx.strokeStyle = '#091428'; wctx.lineWidth = 0.8;
        wctx.beginPath(); wctx.arc(WCX, WCY, IRING, 0, Math.PI * 2); wctx.stroke();

        // Clock ticks
        wctx.strokeStyle = '#1a3a5a'; wctx.lineWidth = 1;
        [0, 0.25, 0.5, 0.75].forEach(function(t) {
          var pa = p2xy(t, RING), pb = p2xy(t, RING + 10);
          wctx.beginPath(); wctx.moveTo(pa.x, pa.y); wctx.lineTo(pb.x, pb.y); wctx.stroke();
        });

        // L-R spread arc (shows the ±φ×f bracket)
        var la = phases.left * 2 * Math.PI - Math.PI / 2;
        var arcSpan = 2 * FACTOR * PHI * 2 * Math.PI;
        wctx.beginPath(); wctx.arc(WCX, WCY, RING + 16, la, la + arcSpan, false);
        wctx.strokeStyle = 'rgba(255,204,100,0.28)'; wctx.lineWidth = 2.5; wctx.stroke();
        var lcap = p2xy(phases.left, RING + 16), rcap = p2xy(phases.right, RING + 16);
        wctx.beginPath(); wctx.arc(lcap.x, lcap.y, 2, 0, Math.PI * 2);
        wctx.fillStyle = 'rgba(255,107,107,0.6)'; wctx.fill();
        wctx.beginPath(); wctx.arc(rcap.x, rcap.y, 2, 0, Math.PI * 2);
        wctx.fillStyle = 'rgba(0,229,255,0.6)'; wctx.fill();

        // Fused spoke
        var fp = p2xy(phases.fused, RING * 0.76);
        wctx.beginPath(); wctx.moveTo(WCX, WCY); wctx.lineTo(fp.x, fp.y);
        wctx.strokeStyle = 'rgba(168,85,247,0.2)'; wctx.lineWidth = 1.5; wctx.stroke();

        // Singularity glow at 12 o'clock
        var dist = Math.min(phases.master, 1 - phases.master);
        var singGlow = Math.max(0, 1 - dist / 0.06);
        if (singGlow > 0) {
          var sp = p2xy(0.0, RING);
          var sg = wctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 24);
          sg.addColorStop(0, 'rgba(255,255,255,' + (singGlow * 0.75) + ')');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          wctx.beginPath(); wctx.arc(sp.x, sp.y, 24, 0, Math.PI * 2);
          wctx.fillStyle = sg; wctx.fill();
        }
        var sp0 = p2xy(0.0, RING + 5);
        wctx.beginPath(); wctx.arc(sp0.x, sp0.y, 2.5, 0, Math.PI * 2);
        wctx.fillStyle = singGlow > 0.2 ? 'rgba(255,255,255,' + (0.4 + singGlow * 0.6) + ')' : '#1a3a5a';
        wctx.fill();

        // Labels
        wctx.font = '9px monospace'; wctx.textAlign = 'center'; wctx.fillStyle = '#2a4a6a';
        wctx.fillText('0.0', WCX, WCY - RING - 18);
        wctx.fillText('0.5', WCX, WCY + RING + 20);
        wctx.fillStyle = '#2a4a6a'; wctx.fillText('±φ', WCX + RING + 24, WCY + 4);
        wctx.font = '8px monospace';
        var ml = p2xy(phases.left,  RING - 14); wctx.fillStyle = SAT_HEX.left;  wctx.fillText('L', ml.x, ml.y + 3);
        var mr = p2xy(phases.right, RING - 14); wctx.fillStyle = SAT_HEX.right; wctx.fillText('R', mr.x, mr.y + 3);
        var mf = p2xy(phases.fused, RING * 0.76 - 14); wctx.fillStyle = SAT_HEX.fused; wctx.fillText('⊕', mf.x, mf.y + 3);
        wctx.textAlign = 'left';

        // Center
        wctx.beginPath(); wctx.arc(WCX, WCY, 3.5, 0, Math.PI * 2);
        wctx.fillStyle = '#0d2040'; wctx.fill();
        wctx.strokeStyle = '#1a3a5a'; wctx.lineWidth = 1;
        wctx.beginPath(); wctx.arc(WCX, WCY, 3.5, 0, Math.PI * 2); wctx.stroke();
      }

      function drawWave(phases) {
        if (!vctx) return;
        wfMaster.push(phases.master);
        wfFused.push(phases.fused);
        if (wfMaster.length > 340) wfMaster.shift();
        if (wfFused.length > 340) wfFused.shift();

        vctx.fillStyle = '#060e1a'; vctx.fillRect(0, 0, 340, 55);
        vctx.strokeStyle = '#0d1f35'; vctx.lineWidth = 0.5;
        vctx.beginPath(); vctx.moveTo(0, 27); vctx.lineTo(340, 27); vctx.stroke();

        // Wrap flash lines
        for (var wi = wrapMarkers.length - 1; wi >= 0; wi--) {
          var wx = 340 - wrapMarkers[wi].age;
          if (wx >= 0) {
            vctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, 0.55 - wrapMarkers[wi].age / 280) + ')';
            vctx.lineWidth = 1;
            vctx.beginPath(); vctx.moveTo(wx, 0); vctx.lineTo(wx, 55); vctx.stroke();
          }
          wrapMarkers[wi].age++;
          if (wrapMarkers[wi].age > 340) wrapMarkers.splice(wi, 1);
        }

        // Master waveform (dim)
        if (wfMaster.length > 1) {
          vctx.strokeStyle = 'rgba(200,216,232,0.2)'; vctx.lineWidth = 1;
          vctx.beginPath();
          for (var mi = 0; mi < wfMaster.length; mi++) {
            var mx = mi + (340 - wfMaster.length), my = 51 - wfMaster[mi] * 46;
            if (mi === 0) vctx.moveTo(mx, my); else vctx.lineTo(mx, my);
          }
          vctx.stroke();
        }

        // Fused waveform (bright purple)
        if (wfFused.length > 1) {
          vctx.strokeStyle = 'rgba(168,85,247,0.9)'; vctx.lineWidth = 1.5;
          vctx.beginPath();
          for (var fi = 0; fi < wfFused.length; fi++) {
            var fx = fi + (340 - wfFused.length), fy = 51 - wfFused[fi] * 46;
            if (fi === 0) vctx.moveTo(fx, fy); else vctx.lineTo(fx, fy);
          }
          vctx.stroke();
          vctx.beginPath(); vctx.arc(339, 51 - wfFused[wfFused.length - 1] * 46, 3, 0, Math.PI * 2);
          vctx.fillStyle = '#a855f7'; vctx.fill();
        }
      }

      function bar(val, color) {
        var w = (val * 100).toFixed(1);
        return '<div style="display:flex;align-items:center;gap:8px;">'
          + '<div style="background:#0a1628;border:1px solid #0d2040;border-radius:2px;height:5px;width:130px;overflow:hidden;">'
          + '<div style="background:' + color + ';height:100%;width:' + w + '%;"></div></div>'
          + '<span style="color:' + color + ';font-size:0.68rem;font-family:monospace;">' + val.toFixed(4) + '</span>'
          + '</div>';
      }

      function updateReadouts(phases) {
        var sats = [
          ['M  Master',     phases.master, SAT_HEX.master],
          ['L  Left  −φ×f', phases.left,   SAT_HEX.left  ],
          ['R  Right +φ×f', phases.right,  SAT_HEX.right ],
          ['T/B  ±0',       phases.top,    SAT_HEX.top   ],
          ['⊕  Fused',      phases.fused,  SAT_HEX.fused ]
        ];
        var el = document.getElementById('echo-phase-readout');
        if (el) el.innerHTML = sats.map(function(s) {
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
            + '<span style="color:#667eea;font-size:0.68rem;font-family:monospace;width:115px;">' + s[0] + '</span>'
            + bar(s[1], s[2]) + '</div>';
        }).join('');

        var tel = document.getElementById('echo-tesla-readout');
        if (tel) tel.innerHTML = TESLA.map(function(h) {
          var v = (phases.master * h[0]) % 1.0;
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
            + '<span style="color:#667eea;font-size:0.68rem;font-family:monospace;width:115px;">' + h[0] + 'x harmonic</span>'
            + bar(v, h[1]) + '</div>';
        }).join('');

        var eel = document.getElementById('echo-fusion-eq');
        if (eel) eel.innerHTML = '<div style="background:#0d1f35;border:1px solid #1a3a5a;border-radius:4px;padding:8px 12px;font-size:0.68rem;font-family:monospace;line-height:2;">'
          + '<span style="color:#2a4a6a;">( </span>'
          + '<span style="color:#ff6b6b;">' + phases.left.toFixed(4) + '</span>'
          + '<span style="color:#2a4a6a;"> + </span>'
          + '<span style="color:#00e5ff;">' + phases.right.toFixed(4) + '</span>'
          + '<span style="color:#2a4a6a;"> + </span>'
          + '<span style="color:#ffcc00;">' + phases.top.toFixed(4) + '</span>'
          + '<span style="color:#2a4a6a;"> × 2 ) ÷ 4  =  </span>'
          + '<span style="color:#a855f7;font-weight:bold;">' + phases.fused.toFixed(6) + '</span>'
          + '</div>';

        var dist = Math.min(phases.master, 1 - phases.master);
        var sel = document.getElementById('echo-singularity');
        if (sel) sel.innerHTML = dist < 0.05
          ? '<div style="color:#fff;font-size:0.68rem;font-family:monospace;letter-spacing:0.1em;">◈ SINGULARITY — all harmonics converge at 0.0</div>'
          : '<div style="color:#2a4a6a;font-size:0.65rem;font-family:monospace;">◇ Singularity at 0.0 · master dist: ' + dist.toFixed(4) + '</div>';

        var wel = document.getElementById('echo-wrap-info');
        if (wel) wel.innerHTML = '<div style="color:#1a3a5a;font-size:0.65rem;font-family:monospace;">Wrap events: <span style="color:#667eea;">' + wrapCount + '</span></div>';
      }

      function tick() {
        var phases = calc();
        if (prevMaster >= 0 && prevMaster > 0.85 && phases.master < 0.15) {
          wrapCount++;
          wrapMarkers.push({ age: 0 });
        }
        prevMaster = phases.master;
        drawWheel(phases);
        drawWave(phases);
        updateReadouts(phases);
        requestAnimationFrame(tick);
      }
      tick();
    })();

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
  const binding = SLOT_LATTICE_MAP[slotIndex];
  auditLog.push({ ts: new Date().toISOString(), action: 'request', slotIndex, apiKeyId: req.apiKeyId });
  saveData();
  res.json({
    ok: true,
    slotIndex,
    keyReleased: true,
    keyMaterial: slot.keyMaterial,
    hasPayload: !!slot.encryptedPayload,
    latticeAddress: binding ? binding.latticeCoords : null,
    latticeNodeIndex: binding ? binding.latticeNodeIndex : null,
    gridPos: binding ? { row: binding.gridRow, col: binding.gridCol } : null
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

app.get('/api/vault/slot-lattice-map', (req, res) => {
  res.json({
    prime: VAULT_PRIME,
    slots: SLOTS,
    f4Sites: generateF4Shell(VAULT_PRIME).length,
    uniqueNodes: NODE_TO_SLOTS.size,
    binding: SLOT_LATTICE_MAP
  });
});

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
  console.log('  Lattice:   ' + NODE_TO_SLOTS.size + ' F4 nodes bound (of 144) · keys derived from slot + lattice address');
  console.log('  API key:   ' + DEFAULT_API_KEY.slice(0, 8) + '…  (set VAULT_API_KEY env to change)');
  console.log('  Data file: ' + DATA_FILE);
  console.log('');
});
