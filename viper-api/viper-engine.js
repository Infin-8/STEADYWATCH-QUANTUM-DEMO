/**
 * VIPER Detection Engine
 * 336 Hurwitz quaternion keys (p=13) arranged in 4 directional arms.
 * Maps any input signature against the key matrix and classifies by kill chain vector.
 *
 * Arms → Kill Chain:
 *   Arm 0 (+X): RECON   — reconnaissance, scanning, probing
 *   Arm 1 (-X): BREACH  — initial access, exploitation
 *   Arm 2 (+Z): LATERAL — lateral movement, privilege escalation
 *   Arm 3 (-Z): EXFIL   — exfiltration, command & control
 */
'use strict';

const crypto = require('crypto');

const TOTAL_KEYS = 336;
const KEYS_PER_ARM = 84;
const NUM_ARMS = 4;

const ARM_VECTORS = [
  { index: 0, name: 'RECON',   direction: '+X', description: 'Reconnaissance — scanning, probing, enumeration' },
  { index: 1, name: 'BREACH',  direction: '-X', description: 'Initial Access — exploitation, credential abuse' },
  { index: 2, name: 'LATERAL', direction: '+Z', description: 'Lateral Movement — privilege escalation, pivoting' },
  { index: 3, name: 'EXFIL',   direction: '-Z', description: 'Exfiltration — data theft, C2 communication' }
];

// --- Hurwitz key generation (p=13, ported from hurwitz-keys.js) ---

function roundHalf(x) {
  return Math.round(x * 2) / 2;
}

function generate24Units() {
  const units = [];
  const integers = [[1,0,0,0],[-1,0,0,0],[0,1,0,0],[0,-1,0,0],[0,0,1,0],[0,0,-1,0],[0,0,0,1],[0,0,0,-1]];
  integers.forEach(u => units.push(u));
  for (let sa of [-1,1]) for (let sb of [-1,1]) for (let sc of [-1,1]) for (let sd of [-1,1])
    units.push([sa*0.5, sb*0.5, sc*0.5, sd*0.5]);
  const seen = new Set();
  return units.filter(u => {
    const k = u.join(',');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 24);
}

function quatMultiply(q, u) {
  return [
    roundHalf(q[0]*u[0] - q[1]*u[1] - q[2]*u[2] - q[3]*u[3]),
    roundHalf(q[0]*u[1] + q[1]*u[0] + q[2]*u[3] - q[3]*u[2]),
    roundHalf(q[0]*u[2] - q[1]*u[3] + q[2]*u[0] + q[3]*u[1]),
    roundHalf(q[0]*u[3] + q[1]*u[2] - q[2]*u[1] + q[3]*u[0])
  ];
}

function norm(q) {
  return Math.round(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
}

function quatKey(q) {
  return q.join(',');
}

function generateHurwitzP13() {
  const p = 13;
  const maxVal = Math.floor(Math.sqrt(p)) + 1;
  const candidates = [];
  for (let a = -maxVal; a <= maxVal; a++)
    for (let b = -maxVal; b <= maxVal; b++)
      for (let c = -maxVal; c <= maxVal; c++) {
        const dSq = p - a*a - b*b - c*c;
        if (dSq >= 0) {
          const d = Math.round(Math.sqrt(dSq));
          if (a*a + b*b + c*c + d*d === p) candidates.push([a,b,c,d]);
          if (d !== 0 && a*a + b*b + c*c + d*d === p) candidates.push([a,b,c,-d]);
        }
      }

  const units = generate24Units();
  const seen = new Set();
  const primes = [];

  for (const q of candidates) {
    for (const u of units) {
      const qResult = quatMultiply(q, u);
      if (norm(qResult) === p) {
        const k = quatKey(qResult);
        if (!seen.has(k)) {
          seen.add(k);
          primes.push(qResult);
        }
      }
    }
  }
  return primes.slice(0, TOTAL_KEYS);
}

// Build the key matrix once at startup
function buildKeyMatrix() {
  const quaternions = generateHurwitzP13();
  return quaternions.map((q, i) => {
    const arm = Math.floor(i / KEYS_PER_ARM);
    const posInArm = i % KEYS_PER_ARM;
    const keyHex = crypto.createHash('sha256')
      .update(q.join(','))
      .digest('hex');
    return {
      index: i,
      arm,
      posInArm,
      vector: ARM_VECTORS[arm],
      quaternion: { a: q[0], b: q[1], c: q[2], d: q[3] },
      keyHex
    };
  });
}

const KEY_MATRIX = buildKeyMatrix();

// --- Detection ---

function hammingDistance(hexA, hexB) {
  const a = Buffer.from(hexA, 'hex');
  const b = Buffer.from(hexB, 'hex');
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) { dist += xor & 1; xor >>= 1; }
  }
  return dist;
}

function scan(input, options = {}) {
  const tier = options.tier || 'strike';  // scout=1arm, strike=4arms
  const sensitivity = Math.max(0, Math.min(1, options.sensitivity || 0.5));

  // Hash the input
  const inputHash = crypto.createHash('sha256').update(String(input)).digest('hex');

  // Select key pool based on tier
  const maxBits = 256;
  let pool = KEY_MATRIX;
  if (tier === 'scout') pool = KEY_MATRIX.filter(k => k.arm === 0);

  // Find closest key(s) by Hamming distance
  const scored = pool.map(node => ({
    ...node,
    distance: hammingDistance(inputHash, node.keyHex)
  })).sort((a, b) => a.distance - b.distance);

  const closest = scored[0];
  const confidence = parseFloat((1 - closest.distance / maxBits).toFixed(4));

  // Threat level based on confidence + sensitivity
  const adjustedScore = confidence + (sensitivity - 0.5) * 0.2;
  let threatLevel;
  if (adjustedScore > 0.85)      threatLevel = 'CRITICAL';
  else if (adjustedScore > 0.75) threatLevel = 'HIGH';
  else if (adjustedScore > 0.65) threatLevel = 'MEDIUM';
  else if (adjustedScore > 0.55) threatLevel = 'LOW';
  else                            threatLevel = 'NOMINAL';

  // Top 3 matches for context
  const matches = scored.slice(0, 3).map(n => ({
    nodeIndex: n.index,
    arm: n.arm,
    vector: n.vector.name,
    distance: n.distance,
    confidence: parseFloat((1 - n.distance / maxBits).toFixed(4))
  }));

  return {
    inputHash,
    threatLevel,
    confidence,
    vector: closest.vector.name,
    vectorDescription: closest.vector.description,
    arm: closest.arm,
    nodeIndex: closest.index,
    posInArm: closest.posInArm,
    quaternion: closest.quaternion,
    matches,
    tier,
    ts: new Date().toISOString()
  };
}

function getArmStats(alertLog) {
  return ARM_VECTORS.map(v => ({
    arm: v.index,
    vector: v.name,
    direction: v.direction,
    description: v.description,
    keys: KEYS_PER_ARM,
    detections: alertLog.filter(a => a.arm === v.index).length
  }));
}

module.exports = { scan, getArmStats, KEY_MATRIX, ARM_VECTORS, TOTAL_KEYS, KEYS_PER_ARM };
