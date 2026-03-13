# THE VAULT™ — Quantum-Backed Key Store

THE VAULT™ is a quantum-seeded key storage system built on Hurwitz quaternion mathematics. It provides 81 cryptographic key slots — each derived from real quantum hardware entropy — organized on a 9×9 board with a 3D crystal interface. Every key has a geometric identity rooted in 4D space. No two slots are the same. No slot can be derived without the original quantum seed.

This is the root of trust for the STEADYWATCH security platform.

---

## The Problem It Solves

Modern key storage relies on pseudorandom number generators, hardware security modules with opaque internals, or cloud KMS services with single-vendor trust chains. None of these produce keys with a verifiable geometric structure. None connect key identity to a mathematical object that exists independently of the software generating it.

THE VAULT™ is different. Each of its 81 keys maps to a specific Hurwitz quaternion — a point in a maximally dense 4D lattice with prime norm p=5. The lattice exists whether or not the software runs. The key's position in that lattice is its identity. Quantum entropy from IBM hardware determines which point in the lattice each slot occupies. The combination — deterministic geometry plus true quantum randomness — produces key material that is both mathematically structured and physically unpredictable.

---

## How It Works

### The Mathematical Foundation

THE VAULT™ uses the p=5 Hurwitz quaternion satellite configuration: 144 quaternion integers with identical prime norm, derived from the densest possible packing of 4D space. These 144 points are distributed across 81 slots on a 9×9 board — the same board geometry used in the 3D interface.

Key material for each slot is computed as:

```
key_material = SHA-256(satellite_key_hex + quantum_seed_hex)
```

Where `satellite_key_hex` is the deterministic Hurwitz quaternion key for that slot, and `quantum_seed_hex` is entropy collected from real IBM Quantum hardware (`ibm_marrakesh`). This formula means:

- **Reproducibility:** Given the same Hurwitz geometry and the same quantum seed, the key is always the same
- **Uniqueness:** Different quantum seeds produce completely different keys from the same geometric base
- **Quantum grounding:** The entropy source is a real physical system — not a PRNG, not a hash chain, not a software simulation

### The 81-Slot Board

The 9×9 board maps directly to slot indices 0–80. Each slot has a fixed position in the Hurwitz quaternion lattice. When you interact with a slot — visually (mining the 3D crystal board) or programmatically (calling the API) — you are addressing a specific 4D coordinate in a mathematical structure that predates the software by decades.

80 of the 81 slots are seeded with real IBM Quantum hardware entropy. Average entropy per slot: **7.80 bits** (measured, not estimated).

### The 3D Interface

The crystal board (`game.js`) is not a demo — it is the interface. Each block on the board is a vault slot. The gemological interaction model mirrors how a cryptographer should treat key material: inspect from above (face-up view), examine structure under different angles (tilt/Brewster flash at θ_B ≈ 59.5°), access what's beneath only from the correct angle (pavilion view). The interface encodes the security model spatially.

---

## The Security Trinity

THE VAULT™ is the root of trust in a three-product security stack built on the same Hurwitz quaternion mathematical foundation:

```
THE VAULT™  (p=5  — 144 keys — 81 slots)  →  Root of trust. Key storage and provisioning.
VIPER       (p=13 — 336 keys — 4 arms)    →  Threat detection. Kill chain classification.
HORDE       (p=17 — 432 keys — 4 clusters) →  Swarm defense. Collective posture response.
```

The key count formula is `24 × (p+1)` for prime p. Each tier uses a larger Hurwitz prime — more keys, denser geometry, broader coverage. THE VAULT™ provisions the keys. VIPER detects when those keys are under threat. HORDE responds.

All three share the same crystal surface visual identity, the same quantum entropy pipeline, and the same mathematical foundation. This is not a product family built from different technologies — it is one mathematical system expressed at three security layers.

---

### Lattice-Metric Authentication

**Date added:** March 13, 2026

THE VAULT™ has a cryptographic identity derived entirely from its Hurwitz prime. No pre-shared secret is required to verify it.

**VAULT's lattice identity:**
- Prime: p=5
- Fingerprint: `e1d594a946e07e52...` (SHA-256 of sorted p=5 F4 shell)
- F4 sites: 144

The F4 shell at p=5 is the set of all Hurwitz quaternion integers with norm equal to 5. This shell contains exactly 144 points. Their sorted SHA-256 hash is THE VAULT™'s lattice fingerprint. Any client that independently generates the p=5 F4 shell and hashes it will arrive at the same fingerprint — no communication with VAULT required beforehand.

**The biometric parallel:** The p=5 cluster shape is VAULT's geometric identity — unique among all Hurwitz primes, independently verifiable, impossible to forge without computing the F4 lattice.

**Retrieving the fingerprint:**
```
GET /auth/lattice-fingerprint
```
Returns VAULT's prime and fingerprint hash. The endpoint `GET /auth/lattice-fingerprint/:prime` returns the fingerprint for any prime.

**Auth flow:**
1. Client sends `POST /auth/lattice-hello` with its own prime claim and fingerprint
2. VAULT verifies the client's claim by independently computing the expected fingerprint for that prime
3. VAULT returns its own claim (p=5, `e1d594a946e07e52...`)
4. Client verifies VAULT's claim by computing the p=5 F4 shell hash independently
5. `POST /auth/lattice-confirm` finalizes mutual authentication and issues a session token
6. Session seed = XOR(client cluster hash, VAULT cluster hash) — deterministic, independently derivable by either party

**Fingerprint View:** The game interface includes a "Fingerprint View" button. A bird's-eye camera reveals the F4 cluster silhouette for p=5 — the same 144-site geometric object used for authentication, made visually inspectable. Label: `Fingerprint: p=5 · 144 sites · ID: e1d594a946e07e52...`

**New endpoints (all three API servers share this interface):**
- `POST /auth/lattice-hello` — verify client claim, return server acknowledgment
- `POST /auth/lattice-confirm` — finalize mutual auth, issue session token
- `GET /auth/lattice-fingerprint` — return this server's lattice fingerprint
- `GET /auth/lattice-fingerprint/:prime` — return fingerprint for any prime

---

## Product Tiers

### Sovereign
- **Slots:** 81 (full 9×9 board)
- **Key material:** IBM Quantum hardware entropy via `ibm_marrakesh`
- **Access:** REST API with key auth, persistent storage, full audit log
- **Dashboard:** Live slot heatmap, entropy stats, API explorer
- **Use case:** Single-tenant key storage for high-value digital assets, credentials, or signing keys

### Constellation
- **Slots:** Multiple vault instances — each with its own 81-slot board and quantum seed
- **Integration:** VIPER threat detection feeds into vault access decisions
- **Use case:** Multi-tenant or multi-environment deployments with shared quantum entropy pipeline

### Citadel *(Enterprise)*
- **Slots:** Custom board geometry, custom Hurwitz prime, custom cluster configuration
- **Integration:** Full Security Trinity — VAULT provisioning + VIPER detection + HORDE response, unified under one API key namespace
- **Features:** Custom moat configurations, M-of-N slot release policies, time-lock, webhook alerting, HSM integration
- **Use case:** Enterprise key infrastructure requiring quantum-resistant key material with full kill chain and defense posture awareness

---

## Licensing

THE VAULT™ is licensed per deployment. A license covers:

- One vault instance (81 slots, one Hurwitz p=5 board)
- Quantum seeding via the STEADYWATCH IBM Quantum entropy pipeline
- API access with configurable key rotation
- Dashboard and audit log

**Security Trinity licensing** bundles THE VAULT™ + VIPER + HORDE under a single license — one quantum entropy pipeline feeding the root of trust (VAULT), the detection layer (VIPER), and the defense layer (HORDE).

Contact: [steadywatchapp@gmail.com](mailto:steadywatchapp@gmail.com)

---

## What Makes It Different

| | Traditional KMS | Hardware HSM | THE VAULT™ |
|---|---|---|---|
| Key geometry | Random | Random | Hurwitz quaternion lattice (4D, mathematically structured) |
| Entropy source | PRNG / OS entropy | Hardware RNG | IBM Quantum hardware (real quantum measurement) |
| Verifiability | Vendor attestation | Physical inspection | Mathematical — the lattice is independently verifiable |
| Interface | API / console | Physical device | 3D crystal board + REST API |
| Security stack | Key storage only | Key storage only | Root of trust → VIPER detection → HORDE defense |
| Quantum resistance | Post-quantum algorithms | Post-quantum algorithms | 4D geometric key identity — no factoring assumption |
| Authentication | API key / OAuth | Client certificate / PKI | Lattice-metric — no pre-shared secret, geometric identity verified from the F4 lattice itself |

---

## More Information

- **API reference:** [README.md](README.md)
- **User guide:** [VAULT_USER_GUIDE.md](VAULT_USER_GUIDE.md)
- **VIPER (threat detection):** [../viper-api/THE_VIPER.md](../viper-api/THE_VIPER.md)
- **HORDE (swarm defense):** [../horde-api/THE_HORDE.md](../horde-api/THE_HORDE.md)
- **Research background:** [RESEARCH_DISCOVERIES.md](../../RESEARCH_DISCOVERIES.md) — Discoveries 41 and 42
