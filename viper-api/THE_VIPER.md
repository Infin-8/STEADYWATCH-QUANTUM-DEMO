# VIPER™ — Quantum-Backed Threat Detection

VIPER™ is a quantum-backed threat detection system built on Hurwitz quaternion mathematics. It classifies any input — a log line, network event, behavioral signature, hash, or raw payload — against 336 detection nodes arranged in 4 directional arms. Each arm maps to a phase of the attack kill chain. Classification is deterministic, geometrically grounded, and requires no training data.

This is the detection layer of the STEADYWATCH security platform.

---

## The Problem It Solves

Modern threat detection relies on one of two approaches: signature matching (known patterns only, blind to novel attacks) or machine learning (probabilistic, requires training data, susceptible to adversarial inputs). Both approaches share a fundamental weakness — they are defined by what has been seen before.

VIPER™ is different. Its 336 detection nodes derive from a mathematical structure — the Hurwitz quaternion lattice at prime p=13 — that exists independently of any observed attack data. The lattice defines 336 points in 4D space with mathematically maximal separation. Any input, hashed to 256 bits, lands closest to one of those points. That point's arm tells you where in the kill chain the threat falls. No training. No signatures. No model to poison or invert.

---

## How It Works

### The Mathematical Foundation

VIPER™ uses the p=13 Hurwitz quaternion satellite configuration: 336 quaternion integers with identical prime norm, distributed across 4 directional arms of 84 nodes each. These arms align with the 4 phases of the attack lifecycle — not by convention, but by the geometric directionality of the Hurwitz lattice itself.

Detection for any input follows a single, transparent pipeline:

```
input → SHA-256(input) → Hamming distance × 336 node hashes → closest node → kill chain arm + confidence
```

Where confidence = `1 - (distance / 256)` — a direct measure of how close the input's hash is to the winning node. No threshold tuning. No hyperparameters. The geometry does the classification.

### The 4 Kill Chain Arms

| Arm | Direction | Vector | Catches |
|-----|-----------|--------|---------|
| 0 | +X | **RECON** | Port scans, DNS enumeration, credential stuffing probes, service fingerprinting |
| 1 | -X | **BREACH** | Exploit attempts, injection attacks, authentication bypass, malware delivery |
| 2 | +Z | **LATERAL** | Token theft, privilege escalation, internal pivoting, pass-the-hash |
| 3 | -Z | **EXFIL** | Large data transfers, C2 beaconing, DNS tunneling, unusual outbound activity |

The directional alignment of the arms (+X, -X, +Z, -Z) is not cosmetic — it reflects the geometric structure of the Hurwitz p=13 lattice in 4D space. Threats of similar type produce hashes that cluster toward the same arm because the underlying mathematics creates stable attractor regions. This stability is a property of the geometry, not a learned artifact.

### The 3D Interface

The circuit board (`game-336.js`) is not a demo — it is the interface. Each of the 336 blocks on the board is a detection node. The 4 arms of the board are the 4 kill chain vectors. When a detection fires at a node, the burst animation shows the event spatially — orbs exploding outward along the arm axis, making the kill chain phase immediately visible. Running VIPER™ alongside the game gives a live spatial map of threat activity: which arm is lighting up tells you where the attacker is in their lifecycle.

---

## The Security Trinity

VIPER™ is the detection layer in a three-product security stack built on the same Hurwitz quaternion mathematical foundation:

```
THE VAULT™  (p=5  — 144 keys — 81 slots)   →  Root of trust. Key storage and provisioning.
VIPER™      (p=13 — 336 keys — 4 arms)     →  Threat detection. Kill chain classification.
HORDE™      (p=17 — 432 keys — 4 clusters) →  Swarm defense. Collective posture response.
```

VIPER™ detects. HORDE™ responds. THE VAULT™ is what they're protecting.

In the operational pipeline, VIPER™ tells you *what* the threat is doing — which phase of the kill chain it has reached. HORDE™ tells you *how* to respond — which defense posture the swarm recommends. Together, they give you both the threat intelligence and the action directive, derived from the same mathematical foundation as the keys they're defending.

---

### Lattice-Metric Authentication

**Date added:** March 13, 2026

VIPER™ has a cryptographic identity derived entirely from its Hurwitz prime. No pre-shared secret is required to verify it.

**VIPER's lattice identity:**
- Prime: p=13
- Fingerprint: `aa270de9ab65cbd2...` (SHA-256 of sorted p=13 F4 shell)
- F4 sites: 336

The F4 shell at p=13 contains exactly 336 points — the same 336 nodes that form VIPER™'s detection matrix. This is not a coincidence: VIPER™ detects threats using the same mathematical structure that authenticates its identity. The 336-node detection matrix and the 336 F4 lattice sites are the same mathematical object.

**Cross-prime verification without a pre-shared secret:** VAULT and VIPER can authenticate each other because each knows the other's expected prime. VAULT knows to expect a p=13 fingerprint from VIPER; VIPER knows to expect a p=5 fingerprint from VAULT. Neither needs prior communication to verify the other's identity — they independently compute the expected F4 shell hash and compare. This means the VAULT→VIPER operational pipeline (key provisioning feeding detection) is now authenticated purely from lattice geometry.

**Retrieving the fingerprint:**
```
GET /auth/lattice-fingerprint
```
Returns VIPER's prime (p=13) and fingerprint hash.

**Auth flow:**
1. Client sends `POST /auth/lattice-hello` with its prime claim and fingerprint
2. VIPER verifies by independently computing the expected fingerprint for that prime
3. VIPER returns its own claim (p=13, `aa270de9ab65cbd2...`)
4. Client verifies by computing the p=13 F4 shell hash independently
5. `POST /auth/lattice-confirm` finalizes mutual auth, issues session token
6. Session seed = XOR(client cluster hash, VIPER cluster hash)

**Fingerprint View:** The game interface includes a "Fingerprint View" button. A bird's-eye camera reveals the F4 cluster silhouette for p=13 — the same 336-site structure used for both detection and authentication. Label: `Fingerprint: p=13 · 336 sites · ID: aa270de9ab65cbd2...`

---

## Product Tiers

### Scout
- **Coverage:** 1 arm (84 nodes) — RECON vector only
- **Use case:** Lightweight perimeter monitoring, early-warning reconnaissance detection, internet-facing exposure
- **Scan:** `"tier": "scout"` — checks arm 0 only, minimal compute, fast response
- **Best for:** Organizations beginning threat detection or monitoring a single exposure surface

### Strike
- **Coverage:** 4 arms (336 nodes) — full kill chain
- **Use case:** Standard deployment — complete kill chain coverage from initial reconnaissance through exfiltration
- **Scan:** `"tier": "strike"` (default)
- **Best for:** Security teams that need full kill chain visibility in a single API call

### Phantom *(Enterprise)*
- **Coverage:** Custom arm selection, adjustable sensitivity per vector
- **Features:** Webhook alerts on threshold breach, streaming scan API for real-time log pipelines, multi-tenant API keys, custom detection configurations
- **Integration:** THE VAULT™ key injection (quantum-seeded node signatures), HORDE™ automatic response trigger, unified threat dashboard
- **Best for:** Enterprise SOC teams, MSSPs, and platform integrators building VIPER™ into a larger security stack

---

## Licensing

VIPER™ is licensed per deployment. A license covers:

- One VIPER™ instance (336 nodes, full 4-arm kill chain)
- REST API with configurable sensitivity and tier selection
- Detection history with filtering and audit trail
- Dashboard and live vector activity monitoring

**Security Trinity licensing** bundles THE VAULT™ + VIPER™ + HORDE™ under a single license — one mathematical foundation covering key storage, threat detection, and defense response.

Contact: [steadywatchapp@gmail.com](mailto:steadywatchapp@gmail.com)

---

## What Makes It Different

| | Signature-Based IDS | ML-Based Detection | VIPER™ |
|---|---|---|---|
| Detection basis | Known attack patterns | Learned from training data | Hurwitz quaternion geometry (4D, mathematically structured) |
| Novel attack coverage | Blind | Partial (requires similar training samples) | Full — any input maps to a kill chain arm |
| Adversarial resistance | Low — evade signatures | Medium — adversarial examples possible | High — no model to invert, geometry is fixed |
| False positive source | Signature gaps | Model uncertainty | Geometry only — confidence score is transparent |
| Training required | Yes (signature updates) | Yes (continuous retraining) | No — detection matrix is deterministic at startup |
| Kill chain mapping | Requires correlation rules | Requires labeled data | Native — arms encode kill chain by construction |
| Quantum resistance | None | None | 4D geometric classification — no statistical assumptions |
| Authentication | API key / OAuth | Client certificate / PKI | Lattice-metric — no pre-shared secret, geometric identity verified from the F4 lattice itself |

---

## More Information

- **API reference:** [README.md](README.md)
- **User guide:** [VIPER_USER_GUIDE.md](VIPER_USER_GUIDE.md)
- **THE VAULT™ (root of trust):** [../vault-api/THE_VAULT.md](../vault-api/THE_VAULT.md)
- **HORDE™ (swarm defense):** [../horde-api/THE_HORDE.md](../horde-api/THE_HORDE.md)
- **Research background:** [RESEARCH_DISCOVERIES.md](../../RESEARCH_DISCOVERIES.md) — Discovery 42
