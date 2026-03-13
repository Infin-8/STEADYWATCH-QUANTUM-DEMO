/**
 * Hurwitz Lattice-Metric Authentication — Express Middleware (Node.js)
 *
 * Shared by vault-api, viper-api, and horde-api.
 * Adds three routes to any Express app:
 *   POST /auth/lattice-hello    — verify client claim, return server ack
 *   POST /auth/lattice-confirm  — finalize mutual auth, issue session token
 *   GET  /auth/lattice-fingerprint/:prime — return fingerprint for any prime
 *
 * Each API server has its own identity prime:
 *   VAULT  (port 5003) → SERVER_PRIME = 5   (144 sites)
 *   VIPER  (port 5001) → SERVER_PRIME = 13  (336 sites)
 *   HORDE  (port 5002) → SERVER_PRIME = 17  (432 sites)
 *
 * Usage in server.js:
 *   const { mountLatticeAuth } = require('../lattice-auth-middleware');
 *   mountLatticeAuth(app, { serverPrime: 5 });
 *
 * Reference: docs/research/HURWITZ_LATTICE_BIOMETRIC_AUTHENTICATION.md
 */

'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// F4 Shell Generator (Node port of js/hurwitz-keys.js)
// ---------------------------------------------------------------------------

function generate24Units() {
  const units = new Set();
  for (let axis = 0; axis < 4; axis++) {
    for (const sign of [1, -1]) {
      const q = [0, 0, 0, 0];
      q[axis] = sign;
      units.add(q.join(','));
    }
  }
  for (const sa of [1, -1]) for (const sb of [1, -1])
    for (const sc of [1, -1]) for (const sd of [1, -1])
      units.add([sa * 0.5, sb * 0.5, sc * 0.5, sd * 0.5].join(','));

  return [...units].slice(0, 24).map(s => s.split(',').map(Number));
}

function quatMultiply(q, u) {
  const a = q[0]*u[0] - q[1]*u[1] - q[2]*u[2] - q[3]*u[3];
  const b = q[0]*u[1] + q[1]*u[0] + q[2]*u[3] - q[3]*u[2];
  const c = q[0]*u[2] - q[1]*u[3] + q[2]*u[0] + q[3]*u[1];
  const d = q[0]*u[3] + q[1]*u[2] - q[2]*u[1] + q[3]*u[0];
  return [Math.round(a*2)/2, Math.round(b*2)/2, Math.round(c*2)/2, Math.round(d*2)/2];
}

function norm(q) { return q[0]**2 + q[1]**2 + q[2]**2 + q[3]**2; }

function generateF4Shell(p) {
  if (p === 2) return generateF4ShellNorm2();
  const solutions = new Set();
  const maxVal = Math.floor(Math.sqrt(p)) + 1;

  // Integer coordinates
  for (let a = -maxVal; a <= maxVal; a++)
    for (let b = -maxVal; b <= maxVal; b++)
      for (let c = -maxVal; c <= maxVal; c++) {
        const dSq = p - a*a - b*b - c*c;
        if (dSq < 0) continue;
        const d = Math.round(Math.sqrt(dSq));
        if (d*d === dSq) {
          solutions.add([a, b, c, d].join(','));
          if (d !== 0) solutions.add([a, b, c, -d].join(','));
        }
      }

  // Half-integer coordinates (all components half-integer)
  for (let a2 = -maxVal*2; a2 <= maxVal*2; a2++) {
    const a = a2 / 2;
    if (a === Math.trunc(a)) continue;
    for (let b2 = -maxVal*2; b2 <= maxVal*2; b2++) {
      const b = b2 / 2;
      if (b === Math.trunc(b)) continue;
      for (let c2 = -maxVal*2; c2 <= maxVal*2; c2++) {
        const c = c2 / 2;
        if (c === Math.trunc(c)) continue;
        const dSq = p - a*a - b*b - c*c;
        if (dSq < 0) continue;
        const d2 = Math.round(Math.sqrt(dSq * 4));
        const d = d2 / 2;
        if (Math.abs(a*a + b*b + c*c + d*d - p) < 0.001) {
          solutions.add([a, b, c, d].join(','));
          solutions.add([a, b, c, -d].join(','));
        }
      }
    }
  }

  const units = generate24Units();
  const seen = new Set();
  const sites = [];
  for (const solStr of solutions) {
    const sol = solStr.split(',').map(Number);
    for (const u of units) {
      const r = quatMultiply(sol, u);
      if (Math.abs(norm(r) - p) < 0.01) {
        const key = r.join(',');
        if (!seen.has(key)) { seen.add(key); sites.push(r); }
      }
    }
  }
  return sites;
}

function generateF4ShellNorm2() {
  const seen = new Set();
  const sites = [];
  for (let a2 = -4; a2 <= 4; a2++)
    for (let b2 = -4; b2 <= 4; b2++)
      for (let c2 = -4; c2 <= 4; c2++)
        for (let d2 = -4; d2 <= 4; d2++) {
          const [a, b, c, d] = [a2/2, b2/2, c2/2, d2/2];
          if (Math.abs(a*a + b*b + c*c + d*d - 2) < 0.01) {
            const key = [a,b,c,d].join(',');
            if (!seen.has(key)) { seen.add(key); sites.push([a,b,c,d]); }
          }
        }
  return sites;
}

// ---------------------------------------------------------------------------
// Lattice Hash — canonical encoding must match Python and JS clients
//   Python: ";".join(f"{a:.4f},{b:.4f},{c:.4f},{d:.4f}" for (a,b,c,d) in sorted(sites))
// ---------------------------------------------------------------------------

// Cache: prime -> hex hash string
const _hashCache = {};

function computeLatticeHash(p) {
  if (_hashCache[p]) return _hashCache[p];
  const sites = generateF4Shell(p);
  // Sort lexicographically: a, b, c, d  (mirrors Python sorted() on tuples)
  sites.sort((a, b) => {
    for (let i = 0; i < 4; i++) { if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; }
    return 0;
  });
  const canonical = sites.map(q => q.map(n => n.toFixed(4)).join(',')).join(';');
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  _hashCache[p] = hash;
  return hash;
}

// XOR two hex hashes into a session seed
function xorHashes(hexA, hexB) {
  const a = Buffer.from(hexA, 'hex');
  const b = Buffer.from(hexB, 'hex');
  return Buffer.from(a.map((byte, i) => byte ^ b[i])).toString('hex');
}

// ---------------------------------------------------------------------------
// In-memory session store (replace with Redis/DB for production)
// ---------------------------------------------------------------------------

const sessions = new Map();   // session_id -> { clientPrime, serverPrime, clientHash, serverHash, expiresAt }
const SESSION_TTL_MS = 5 * 60 * 1000;  // 5 minutes

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) sessions.delete(id);
  }
}
setInterval(cleanExpiredSessions, 60_000);

// ---------------------------------------------------------------------------
// Mount function — call this in each server.js
// ---------------------------------------------------------------------------

/**
 * mountLatticeAuth(app, options)
 *
 * @param {object} app          — Express app instance
 * @param {object} options
 * @param {number} options.serverPrime  — This server's identity prime (5, 13, or 17)
 * @param {string} [options.serverSecret] — HMAC secret for session tokens (env var recommended)
 */
function mountLatticeAuth(app, options) {
  const SERVER_PRIME = options.serverPrime;
  const SERVER_HASH  = computeLatticeHash(SERVER_PRIME);
  const SERVER_SECRET = options.serverSecret
    || process.env.LATTICE_SESSION_SECRET
    || 'lattice-demo-secret-change-in-production';

  console.log(`  🔑 Lattice auth: server prime p=${SERVER_PRIME}, fingerprint=${SERVER_HASH.slice(0, 12)}...`);

  // --------------------------------------------------------
  // POST /auth/lattice-hello
  // Client presents their lattice claim; server verifies and returns its own
  // --------------------------------------------------------
  app.post('/auth/lattice-hello', (req, res) => {
    const { prime_claim, cluster_hash, nonce, party_id } = req.body || {};

    if (!prime_claim || !cluster_hash || !nonce) {
      return res.status(400).json({ error: 'Missing fields: prime_claim, cluster_hash, nonce' });
    }

    // Verify client's cluster hash against expected F4 shell
    let expectedHash;
    try {
      expectedHash = computeLatticeHash(prime_claim);
    } catch (e) {
      return res.status(400).json({ error: 'Could not compute F4 shell for claimed prime' });
    }

    if (!crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(cluster_hash, 'hex'))) {
      return res.status(401).json({ error: 'Lattice claim verification failed — cluster hash mismatch' });
    }

    // Client verified — create session and return server's own ack
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, {
      clientPrime: prime_claim,
      serverPrime: SERVER_PRIME,
      clientHash:  cluster_hash,
      serverHash:  SERVER_HASH,
      partyId:     party_id || 'unknown',
      expiresAt:   Date.now() + SESSION_TTL_MS,
      confirmed:   false
    });

    return res.json({
      type:           'LATTICE_ACK',
      session_id:     sessionId,
      verified:       true,
      challenge:      crypto.randomBytes(32).toString('hex'),
      verifier_prime: SERVER_PRIME,
      verifier_hash:  SERVER_HASH,
      verifier_nonce: crypto.randomBytes(32).toString('hex'),
      timestamp:      Math.floor(Date.now() / 1000)
    });
  });

  // --------------------------------------------------------
  // POST /auth/lattice-confirm
  // Client confirms mutual auth; server issues session token
  // --------------------------------------------------------
  app.post('/auth/lattice-confirm', (req, res) => {
    const { session_id, mutual_verified, session_seed } = req.body || {};

    if (!session_id || !mutual_verified) {
      return res.status(400).json({ error: 'Missing fields: session_id, mutual_verified' });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }
    if (session.expiresAt < Date.now()) {
      sessions.delete(session_id);
      return res.status(401).json({ error: 'Session expired' });
    }

    // Verify the session seed matches our own XOR derivation
    const expectedSeed = xorHashes(session.clientHash, session.serverHash);
    if (session_seed && session_seed !== expectedSeed) {
      return res.status(401).json({ error: 'Session seed mismatch' });
    }

    // Mark session confirmed
    session.confirmed = true;
    session.sessionSeed = expectedSeed;

    // Issue session token: HMAC-SHA256(session_id + seed, SERVER_SECRET)
    const tokenPayload = session_id + ':' + expectedSeed;
    const token = crypto.createHmac('sha256', SERVER_SECRET).update(tokenPayload).digest('hex');

    return res.json({
      type:         'LATTICE_CONFIRM',
      success:      true,
      session_id:   session_id,
      session_token: token,
      server_prime: SERVER_PRIME,
      timestamp:    Math.floor(Date.now() / 1000)
    });
  });

  // --------------------------------------------------------
  // GET /auth/lattice-fingerprint/:prime
  // Public endpoint — return the expected fingerprint for any prime.
  // Useful for clients to pre-verify before connecting.
  // --------------------------------------------------------
  app.get('/auth/lattice-fingerprint/:prime', (req, res) => {
    const p = parseInt(req.params.prime, 10);
    if (!p || p < 2) {
      return res.status(400).json({ error: 'Invalid prime' });
    }
    let hash, siteCount;
    try {
      hash = computeLatticeHash(p);
      siteCount = generateF4Shell(p).length;
    } catch (e) {
      return res.status(500).json({ error: 'Could not compute F4 shell' });
    }
    return res.json({
      prime:       p,
      hash:        hash,
      short_id:    hash.slice(0, 12),
      site_count:  siteCount,
      formula:     `24 × (${p} + 1) = ${siteCount}`
    });
  });

  // --------------------------------------------------------
  // GET /auth/lattice-fingerprint  (server's own fingerprint)
  // --------------------------------------------------------
  app.get('/auth/lattice-fingerprint', (req, res) => {
    return res.json({
      prime:      SERVER_PRIME,
      hash:       SERVER_HASH,
      short_id:   SERVER_HASH.slice(0, 12),
      site_count: 24 * (SERVER_PRIME + 1),
      formula:    `24 × (${SERVER_PRIME} + 1) = ${24 * (SERVER_PRIME + 1)}`
    });
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  mountLatticeAuth,
  computeLatticeHash,
  generateF4Shell,
  xorHashes
};
