/**
 * THE VAULT™ API — 81-slot key store.
 * Receives key material (demo: derived from seed), stores encrypted payloads per slot,
 * exposes store/request subject to policy and auth. Audit log for key-release requests.
 */
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const SLOTS = 81;
const DEFAULT_API_KEY = process.env.VAULT_API_KEY || 'vault-demo-key-change-in-production';

// Demo key material: 81 slots, each gets a deterministic key from seed (placeholder for SHQKD/Echo)
function deriveSlotKey(slotIndex) {
  const seed = process.env.VAULT_KEY_SEED || 'SHQKD-Echo-Resonance-81';
  return crypto.createHash('sha256').update(seed + '-' + slotIndex).digest('hex');
}

const keyStore = new Map();
for (let i = 0; i < SLOTS; i++) {
  keyStore.set(i, { keyMaterial: deriveSlotKey(i), encryptedPayload: null });
}

const auditLog = [];

// Configs: custom key configurations (moat, symbol, tier). In-memory; keyed by id.
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

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-vault-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey || apiKey !== DEFAULT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  req.apiKeyId = apiKey.slice(0, 8);
  next();
}

app.get('/api/vault/health', (req, res) => {
  res.json({ status: 'ok', slots: SLOTS, service: 'THE VAULT™ API' });
});

app.get('/api/vault/slots', (req, res) => {
  const filled = [];
  for (let i = 0; i < SLOTS; i++) {
    const s = keyStore.get(i);
    if (s && s.encryptedPayload) filled.push(i);
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
  res.json({ ok: true, slotIndex });
});

app.post('/api/vault/request', authMiddleware, (req, res) => {
  const { slotIndex } = req.body || {};
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= SLOTS) {
    return res.status(400).json({ error: 'Bad request', message: 'slotIndex must be 0..80' });
  }
  const slot = keyStore.get(slotIndex);
  auditLog.push({ ts: new Date().toISOString(), action: 'request', slotIndex, apiKeyId: req.apiKeyId });
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

// --- Configs API (custom key configurations → tiered packages) ---
app.get('/api/vault/configs', authMiddleware, (req, res) => {
  const list = Array.from(configsStore.values()).map(c => ({
    id: c.id,
    name: c.name,
    tier: c.tier,
    crownSlotIndex: c.crownSlotIndex
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

const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log('THE VAULT™ API listening on port', port);
  console.log('Demo API key:', DEFAULT_API_KEY.slice(0, 8) + '...');
});
