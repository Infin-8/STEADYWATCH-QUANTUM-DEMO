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

const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log('THE VAULT™ API listening on port', port);
  console.log('Demo API key:', DEFAULT_API_KEY.slice(0, 8) + '...');
});
