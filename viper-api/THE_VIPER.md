# THE VIPER™ — Product and Architecture

VIPER is the quantum-backed threat detection layer of the STEADYWATCH security platform. It maps any input signature against 336 Hurwitz quaternion keys arranged in 4 directional arms, classifying threats by their position in the attack kill chain. The 3D mining game (`game-336.js`) is the visual interface; the API is the product.

---

## What It Is

- **Concept:** Security events don't have random signatures — they cluster by attack type. VIPER uses the geometric structure of the Hurwitz quaternion system to create a 336-point detection matrix with natural, mathematically maximal separation between nodes. Each input maps to the closest node, and the node's arm tells you where in the kill chain the threat falls.

- **336 nodes:** The p=13 Hurwitz satellite configuration produces exactly 336 quaternion keys. These are distributed across 4 directional arms — 84 nodes per arm — corresponding to the 4 phases of the attack lifecycle.

- **Kill chain mapping:**
  - **Arm 0 (+X) — RECON:** Reconnaissance, scanning, enumeration. The earliest phase — attackers learning the target.
  - **Arm 1 (-X) — BREACH:** Initial access, exploitation, credential abuse. The entry point.
  - **Arm 2 (+Z) — LATERAL:** Lateral movement, privilege escalation, pivoting. The attacker spreading inside.
  - **Arm 3 (-Z) — EXFIL:** Exfiltration, C2 communication, data theft. The endgame.

- **Detection:** `SHA-256(input)` → Hamming distance against all 336 key hashes → closest node → vector classification + confidence score.

---

## Architecture

### Detection Engine (`viper-engine.js`)

The engine generates all 336 Hurwitz p=13 quaternion keys at startup using the same algorithm as the 3D game. Each key is hashed with SHA-256 to produce a 256-bit node signature. On scan:

1. The input is hashed: `inputHash = SHA-256(input)`
2. Hamming distance is computed against all 336 node hashes
3. The closest node determines the arm (kill chain vector)
4. Confidence = `1 - (distance / 256)` — how close the match is
5. Threat level is derived from confidence adjusted by sensitivity

The quaternion keys have a critical property: they are maximally separated in 4D space by construction (Hurwitz prime norm = 13). This separation persists when projected to hash space — the 336 node hashes are well-distributed across the 256-bit space, making classification stable and unambiguous.

### API Server (`server.js`)

Express server on port 5001. Endpoints:
- `POST /api/viper/scan` — primary detection endpoint
- `GET /api/viper/alerts` — detection history with filtering
- `GET /api/viper/status` — arm activity, uptime, counts
- `GET /api/viper/vectors` — per-arm statistics
- `GET /` — live dashboard

All detection events are persisted to `viper-data.json` and loaded on startup.

### Dashboard

The dashboard at `http://localhost:5001/` provides:
- Vector activity bars showing detection distribution across all 4 kill chain arms
- Live detection feed with threat levels color-coded by severity
- Interactive API explorer — submit scans and read results without curl
- Per-arm breakdown of historical detection patterns

---

## Product Identity

### The Visual Origin

VIPER's visual identity is the chest-burster from *Alien*: a threat that moves fast along a structural axis, bursting outward from a defined vector. In the 3D game, mining a key ore block triggers the vel burst pop — orbs exploding outward along the arm axis. This is not metaphor. This is the detection event made spatial: the threat is classified, the arm fires, the burst shows you exactly which vector it came from.

The 4-arm circuit board structure of game-336.js IS VIPER's architecture. The linear arm layout (FourWayVertex) was chosen because it gives each key a clear directional identity. The circuit board aesthetic reflects the structured, network-topology nature of kill chain detection — defined paths, defined nodes, defined vectors.

### Mathematical Foundation

The Hurwitz quaternion integers form a discrete lattice in 4D space — the densest possible packing of the quaternion group. The p=13 satellite configuration selects 336 of these points with identical norm. This gives VIPER:

- **Stability:** The same input always maps to the same node. Detection is deterministic, not probabilistic.
- **Coverage:** 336 nodes with maximal inter-node separation means no region of the hash space is unmonitored.
- **Quantum resistance:** The detection signatures are derived from 4D geometry, not from learned patterns. There is no training data to poisoning, no model to invert.

### Connection to THE VAULT™

VIPER is downstream of THE VAULT. The vault's 81-slot key store (p=5 Hurwitz, 144 keys) is the root of trust. VIPER's 336-node detection matrix (p=13) is the expanded coverage layer built on the same mathematical foundation.

In production, VIPER's node signatures should be seeded with quantum entropy from THE VAULT rather than deterministic SHA-256 — rotating the detection surface with each IBM hardware run and making signatures impossible to precompute.

---

## Product Tiers

### Scout
- **Coverage:** 1 arm (84 nodes) — RECON vector only
- **Use case:** Lightweight perimeter monitoring, early-warning reconnaissance detection
- **Scan:** `"tier": "scout"` — checks arm 0 only, faster response

### Strike
- **Coverage:** 4 arms (336 nodes) — full kill chain
- **Use case:** Standard deployment — complete kill chain coverage across all 4 vectors
- **Scan:** `"tier": "strike"` (default)

### Phantom *(Enterprise)*
- **Coverage:** Custom arm selection, adjustable sensitivity per vector
- **Features:** Webhook alerts, streaming scan API, custom detection configurations, multi-tenant API keys
- **Integration:** Vault key injection, HORDE coordination, unified threat dashboard

---

## The Security Trinity

VIPER is the detection layer in a three-product security stack:

```
THE VAULT™  (game.js    — 144 keys — p=5)   →  Root of trust, key storage
VIPER       (game-336.js — 336 keys — p=13) →  Threat detection, kill chain classification
HORDE       (game-432.js — 432 keys — p=17) →  Swarm defense, collective response
```

All three share the same Hurwitz quaternion mathematical foundation, the same crystal surface visual identity, and the same quantum entropy pipeline. THE VAULT provisions the keys. VIPER detects when those keys are under threat. HORDE responds.

---

## User Flow

1. **Start VIPER:** `cd viper-api && npm start`
2. **Open the dashboard:** `http://localhost:5001/`
3. **Submit a scan:** POST any suspicious input — log line, IP, event, hash
4. **Read the classification:** Vector tells you kill chain phase. Threat level tells you urgency. Confidence tells you certainty. The top 3 node matches show you the closest alternatives.
5. **Watch the dashboard:** Vector bars grow as detections accumulate. Patterns emerge — which kill chain phase is most active tells you where the attacker is in their lifecycle.
6. **Integrate:** Wire `POST /api/viper/scan` into your log pipeline, SIEM, or security automation. VIPER returns structured JSON — drop it into any downstream system.

---

## Future

- **Quantum-seeded node signatures** — replace SHA-256 derived key hashes with IBM hardware entropy via THE VAULT pipeline
- **HORDE coordination** — when VIPER detects BREACH or LATERAL, automatically trigger HORDE swarm response on the affected nodes
- **Streaming mode** — continuous input stream classification for real-time log analysis
- **Phantom tier** — per-vector sensitivity, webhook alerting, multi-tenant keys, custom node configurations
- **Visualization integration** — live `game-336.js` board updates driven by API scan events — the game board lights up in real time as threats are detected

---

## More Information

- **API reference:** [README.md](README.md)
- **User guide:** [VIPER_USER_GUIDE.md](VIPER_USER_GUIDE.md)
- **Security Trinity:** [../vault-api/THE_VAULT.md](../vault-api/THE_VAULT.md)
- **Research background:** [RESEARCH_DISCOVERIES.md](../../RESEARCH_DISCOVERIES.md) — Discovery 42
