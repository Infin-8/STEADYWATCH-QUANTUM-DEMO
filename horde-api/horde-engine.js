/**
 * HORDE Defense Engine
 * 432 Hurwitz quaternion keys (p=17) arranged in 4 swarm clusters.
 * Uses collective consensus — a threat must activate a neighborhood of nodes,
 * not just one. The cluster with the most responding nodes wins.
 *
 * This is the fundamental difference from VIPER:
 *   VIPER  → single closest node → precision targeting → kill chain vector
 *   HORDE  → neighborhood consensus → swarm agreement → defense posture
 *
 * Clusters → Defense Postures:
 *   Cluster 0 (+X): SWARM    — mass collective response, overwhelming force
 *   Cluster 1 (-X): SHIELD   — protective formation, defensive clustering
 *   Cluster 2 (+Z): TRACE    — tracking and hunting, persistent pursuit
 *   Cluster 3 (-Z): ADAPT    — adaptive response, update defenses
 *
 * Formula: 24 × (p+1) Hurwitz keys for prime p
 *   p=5  → 144 keys (THE VAULT)
 *   p=13 → 336 keys (VIPER)
 *   p=17 → 432 keys (HORDE)
 */
'use strict';

const crypto = require('crypto');

const TOTAL_KEYS = 432;
const KEYS_PER_CLUSTER = 108;
const NUM_CLUSTERS = 4;

const CLUSTERS = [
  { index: 0, name: 'SWARM',  direction: '+X', description: 'Mass collective response — overwhelming coordinated force' },
  { index: 1, name: 'SHIELD', direction: '-X', description: 'Protective formation — defensive clustering around assets' },
  { index: 2, name: 'TRACE',  direction: '+Z', description: 'Persistent tracking — hunting and containing the threat' },
  { index: 3, name: 'ADAPT',  direction: '-Z', description: 'Adaptive defense — learning, updating, hardening posture' }
];

// --- Hurwitz key generation (p=17, 432 keys) ---

function roundHalf(x) {
  return Math.round(x * 2) / 2;
}

function generate24Units() {
  const units = [];
  [[1,0,0,0],[-1,0,0,0],[0,1,0,0],[0,-1,0,0],[0,0,1,0],[0,0,-1,0],[0,0,0,1],[0,0,0,-1]]
    .forEach(u => units.push(u));
  for (let sa of [-1,1]) for (let sb of [-1,1]) for (let sc of [-1,1]) for (let sd of [-1,1])
    units.push([sa*0.5, sb*0.5, sc*0.5, sd*0.5]);
  const seen = new Set();
  return units.filter(u => { const k = u.join(','); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 24);
}

function quatMultiply(q, u) {
  return [
    roundHalf(q[0]*u[0] - q[1]*u[1] - q[2]*u[2] - q[3]*u[3]),
    roundHalf(q[0]*u[1] + q[1]*u[0] + q[2]*u[3] - q[3]*u[2]),
    roundHalf(q[0]*u[2] - q[1]*u[3] + q[2]*u[0] + q[3]*u[1]),
    roundHalf(q[0]*u[3] + q[1]*u[2] - q[2]*u[1] + q[3]*u[0])
  ];
}

function norm(q) { return Math.round(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]); }

function generateHurwitzP17() {
  const p = 17;
  const maxVal = Math.floor(Math.sqrt(p)) + 1;
  const candidates = [];
  for (let a = -maxVal; a <= maxVal; a++)
    for (let b = -maxVal; b <= maxVal; b++)
      for (let c = -maxVal; c <= maxVal; c++) {
        const dSq = p - a*a - b*b - c*c;
        if (dSq >= 0) {
          const d = Math.round(Math.sqrt(dSq));
          if (a*a + b*b + c*c + d*d === p) candidates.push([a,b,c,d]);
          if (d !== 0) candidates.push([a,b,c,-d]);
        }
      }

  const units = generate24Units();
  const seen = new Set();
  const keys = [];
  for (const q of candidates) {
    for (const u of units) {
      const r = quatMultiply(q, u);
      if (norm(r) === p) {
        const k = r.join(',');
        if (!seen.has(k)) { seen.add(k); keys.push(r); }
      }
    }
  }
  return keys.slice(0, TOTAL_KEYS);
}

function buildKeyMatrix() {
  const quaternions = generateHurwitzP17();
  return quaternions.map((q, i) => {
    const cluster = Math.floor(i / KEYS_PER_CLUSTER);
    const posInCluster = i % KEYS_PER_CLUSTER;
    const keyHex = crypto.createHash('sha256').update(q.join(',')).digest('hex');
    return {
      index: i,
      cluster,
      posInCluster,
      swarmCluster: CLUSTERS[cluster],
      quaternion: { a: q[0], b: q[1], c: q[2], d: q[3] },
      keyHex
    };
  });
}

const KEY_MATRIX = buildKeyMatrix();

// --- Swarm Consensus Detection ---

function hammingDistance(hexA, hexB) {
  const a = Buffer.from(hexA, 'hex');
  const b = Buffer.from(hexB, 'hex');
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i]; while (xor) { dist += xor & 1; xor >>= 1; }
  }
  return dist;
}

function swarm(input, options = {}) {
  const tier = options.tier || 'swarm';
  const sensitivity = Math.max(0, Math.min(1, options.sensitivity || 0.5));

  const inputHash = crypto.createHash('sha256').update(String(input)).digest('hex');

  // Score all nodes by distance
  let pool = KEY_MATRIX;
  if (tier === 'colony') pool = KEY_MATRIX.filter(k => k.cluster === 0);

  const scored = pool
    .map(node => ({ ...node, distance: hammingDistance(inputHash, node.keyHex) }))
    .sort((a, b) => a.distance - b.distance);

  // Swarm neighborhood: top 25% closest nodes respond
  const neighborhoodSize = Math.max(4, Math.floor(pool.length * 0.25));
  const neighborhood = scored.slice(0, neighborhoodSize);

  // Count responding nodes per cluster
  const clusterCounts = [0, 0, 0, 0];
  const clusterDistances = [[], [], [], []];
  neighborhood.forEach(n => {
    clusterCounts[n.cluster]++;
    clusterDistances[n.cluster].push(n.distance);
  });

  // Winning cluster = most nodes in neighborhood
  const maxCount = Math.max(...clusterCounts);
  const winningCluster = clusterCounts.indexOf(maxCount);

  // Consensus score = proportion of neighborhood nodes in winning cluster
  const consensusScore = parseFloat((maxCount / neighborhoodSize).toFixed(4));

  // Average distance of winning cluster nodes
  const winDistances = clusterDistances[winningCluster];
  const avgDistance = winDistances.length > 0
    ? winDistances.reduce((a, b) => a + b, 0) / winDistances.length
    : 128;
  const proximity = parseFloat((1 - avgDistance / 256).toFixed(4));

  // Combined threat score
  const rawScore = (consensusScore * 0.6 + proximity * 0.4) + (sensitivity - 0.5) * 0.2;

  let threatLevel;
  if (rawScore > 0.72)      threatLevel = 'CRITICAL';
  else if (rawScore > 0.62) threatLevel = 'HIGH';
  else if (rawScore > 0.52) threatLevel = 'MEDIUM';
  else if (rawScore > 0.42) threatLevel = 'LOW';
  else                       threatLevel = 'NOMINAL';

  // Defense recommendation based on cluster
  const defenseActions = {
    SWARM:  'Deploy mass response — activate all available defense nodes',
    SHIELD: 'Form protective perimeter — isolate assets and cluster defenses',
    TRACE:  'Initiate persistent tracking — do not alert, maintain surveillance',
    ADAPT:  'Update defense posture — rotate signatures, patch surface area'
  };

  // Cluster breakdown for transparency
  const clusterBreakdown = CLUSTERS.map((c, i) => ({
    cluster: i,
    name: c.name,
    respondingNodes: clusterCounts[i],
    proportion: parseFloat((clusterCounts[i] / neighborhoodSize).toFixed(3))
  }));

  return {
    inputHash,
    threatLevel,
    consensusScore,
    proximity,
    defensePosture: CLUSTERS[winningCluster].name,
    postureDescription: CLUSTERS[winningCluster].description,
    defenseAction: defenseActions[CLUSTERS[winningCluster].name],
    winningCluster,
    neighborhoodSize,
    respondingNodes: maxCount,
    clusterBreakdown,
    tier,
    ts: new Date().toISOString()
  };
}

function getClusterStats(responseLog) {
  return CLUSTERS.map(c => ({
    cluster: c.index,
    name: c.name,
    direction: c.direction,
    description: c.description,
    nodes: KEYS_PER_CLUSTER,
    activations: responseLog.filter(r => r.winningCluster === c.index).length
  }));
}

module.exports = { swarm, getClusterStats, KEY_MATRIX, CLUSTERS, TOTAL_KEYS, KEYS_PER_CLUSTER };
