#!/usr/bin/env node
/**
 * seed-vault.js — Inject real IBM quantum entropy seeds into THE VAULT™ key store.
 *
 * Reads seed_run results (144 satellites, ibm_marrakesh hardware + simulator recovery),
 * maps the first 81 satellite seeds to vault slots 0..80, and writes vault-data.json.
 *
 * Each slot gets:
 *   keyMaterial = SHA-256(satellite_key_hex + seed_hex)
 *   — combines the deterministic Hurwitz quaternion key with the quantum entropy seed.
 *
 * Usage:
 *   node seed-vault.js [--source /path/to/seed_run_results.json] [--dry-run]
 *
 * Stop the vault server before running, then restart after to load the new keys.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_SOURCE = path.join(
  __dirname, '..', '..', 'quantum_computing',
  'seed_run_144_results_1773331809.json'
);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sourceArg = args.indexOf('--source');
const sourcePath = sourceArg !== -1 ? args[sourceArg + 1] : DEFAULT_SOURCE;
const dataFile = path.join(__dirname, 'vault-data.json');
const SLOTS = 81;

// --- Load seed run results ---
if (!fs.existsSync(sourcePath)) {
  console.error('  ERROR: Seed run file not found:', sourcePath);
  console.error('  Use --source /path/to/seed_run_results.json');
  process.exit(1);
}

const seedRun = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const results = seedRun.results;
if (!Array.isArray(results) || results.length < SLOTS) {
  console.error('  ERROR: Need at least', SLOTS, 'results, found:', results?.length);
  process.exit(1);
}

// Sort by satellite_index to be safe
results.sort((a, b) => a.satellite_index - b.satellite_index);

// --- Load existing vault data (preserve any stored payloads) ---
let existing = { slots: {}, auditLog: [] };
if (fs.existsSync(dataFile)) {
  try {
    existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    console.warn('  Warning: Could not read existing vault-data.json — starting fresh');
  }
}

// --- Build seeded slots ---
const slots = {};
const summary = [];

for (let i = 0; i < SLOTS; i++) {
  const sat = results[i];
  if (!sat || typeof sat.seed_hex !== 'string' || typeof sat.satellite_key_hex !== 'string') {
    console.error('  ERROR: Missing seed data for satellite index', i);
    process.exit(1);
  }

  // Combine Hurwitz quaternion key + IBM quantum entropy seed
  const keyMaterial = crypto
    .createHash('sha256')
    .update(sat.satellite_key_hex + sat.seed_hex)
    .digest('hex');

  // Preserve any existing encrypted payload for this slot
  const existingSlot = existing.slots && existing.slots[i];

  slots[i] = {
    keyMaterial,
    encryptedPayload: existingSlot?.encryptedPayload || null
  };

  summary.push({
    slot: i,
    satellite: sat.satellite_index,
    source: sat.source || 'unknown',
    entropy_bits: sat.entropy_bits?.toFixed(3),
    keyMaterial: keyMaterial.slice(0, 16) + '…'
  });
}

// --- Print summary ---
console.log('');
console.log('  THE VAULT™ — Quantum Seed Injection');
console.log('  ─────────────────────────────────────────────────────');
console.log('  Source:     ', path.basename(sourcePath));
console.log('  Slots:      ', SLOTS);
console.log('  Total sats: ', results.length);
console.log('');

const hardwareSlots = summary.filter(s => s.source === 'ibm_recovered').length;
const simSlots = summary.filter(s => s.source !== 'ibm_recovered').length;
console.log('  Key material = SHA-256(satellite_key_hex + seed_hex)');
console.log('  IBM hardware seeds:', hardwareSlots, '/', SLOTS);
console.log('  Simulator seeds:   ', simSlots, '/', SLOTS);
console.log('');

// Show first 5 and last 2
[...summary.slice(0, 5), { slot: '...', satellite: '...', source: '...', entropy_bits: '...', keyMaterial: '...' }, ...summary.slice(-2)].forEach(s => {
  if (s.slot === '...') { console.log('  ...'); return; }
  console.log(`  Slot ${String(s.slot).padStart(2)} ← sat ${String(s.satellite).padStart(3)}  ${String(s.source).padEnd(14)} ${s.entropy_bits} bits  ${s.keyMaterial}`);
});

console.log('');

if (dryRun) {
  console.log('  DRY RUN — vault-data.json not written. Remove --dry-run to apply.');
  console.log('');
  process.exit(0);
}

// --- Write vault-data.json ---
const output = {
  slots,
  auditLog: existing.auditLog || [],
  seededAt: new Date().toISOString(),
  seedSource: path.basename(sourcePath),
  seedNote: `IBM hardware + simulator recovery run. ${hardwareSlots} hardware slots, ${simSlots} simulator slots.`
};

fs.writeFileSync(dataFile, JSON.stringify(output, null, 2));
console.log('  Written: vault-data.json');
console.log('  Restart the vault server to load the new keys: npm start');
console.log('');
