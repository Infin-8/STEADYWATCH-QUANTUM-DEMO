# THE HORDE™ — Product and Architecture

HORDE is the quantum-backed swarm defense layer of the STEADYWATCH security platform. It maps any threat input against 432 Hurwitz quaternion keys arranged in 4 defense clusters, using collective neighborhood consensus to determine the appropriate defensive posture. The 3D mining game (`game-432.js`) is the visual interface; the API is the product.

---

## What It Is

- **Concept:** Defense is not a single action — it is a collective decision. HORDE uses the geometric structure of the Hurwitz quaternion system to create a 432-point defense matrix where every threat input activates a neighborhood of nodes, and the cluster with the most votes determines the response posture. No single node makes the call — the swarm decides.

- **432 nodes:** The p=17 Hurwitz satellite configuration produces exactly 432 quaternion keys. These are distributed across 4 defense clusters — 108 nodes per cluster — corresponding to the 4 strategic defense doctrines.

- **Defense posture mapping:**
  - **Cluster 0 (+X) — SWARM:** Mass collective response. Deploy all available defense assets. Overwhelm the threat with coordinated force. Use when the attacker is exposed and the cost of visibility is acceptable.
  - **Cluster 1 (-X) — SHIELD:** Protective formation. Isolate critical assets, cluster defenses around high-value targets. Use when the attack surface needs to be contracted and hardened.
  - **Cluster 2 (+Z) — TRACE:** Persistent tracking. Do not alert. Maintain covert surveillance — let the attacker move while you map the full threat. Use when intelligence value exceeds the cost of continued exposure.
  - **Cluster 3 (-Z) — ADAPT:** Update and harden. Rotate signatures, patch the attack surface, change the geometry the attacker is mapping. Use when the threat is probing a fixed surface that can be changed.

- **Consensus:** `SHA-256(input)` → Hamming distance against all 432 key hashes → top 25% neighborhood → cluster vote → defense posture + consensus score.

---

## Architecture

### Defense Engine (`horde-engine.js`)

The engine generates all 432 Hurwitz p=17 quaternion keys at startup using the same algorithm as the 3D game. Each key is hashed with SHA-256 to produce a 256-bit node signature. On a respond call:

1. The input is hashed: `inputHash = SHA-256(input)`
2. Hamming distance is computed against all 432 node hashes
3. The top 25% closest nodes (108 for full swarm tier) form the neighborhood
4. Votes are counted per cluster: `clusterCounts[node.cluster]++`
5. The cluster with the most votes wins — its posture is the defense recommendation
6. Consensus score = `winningVotes / neighborhoodSize`
7. Proximity = `1 - (avgWinningDistance / 256)` — how close the neighborhood is to the input
8. Combined threat score = `consensusScore × 0.6 + proximity × 0.4 ± sensitivity adjustment`

The quaternion keys have a critical structural property: generated from p=17 Hurwitz primes, they form a maximally dense packing of the 4D quaternion space. This density means that similar inputs activate overlapping neighborhoods — and therefore tend to produce consistent cluster votes. The consensus model is stable because the geometry is stable.

### Neighborhood Size

The neighborhood is always the top 25% of the pool:
- **Swarm tier (432 keys):** 108 nodes respond
- **Colony tier (108 keys, cluster 0):** 27 nodes respond

This fixed 25% neighborhood is the core of the swarm model. It is large enough to produce reliable consensus while remaining sensitive enough to differentiate threat classes.

### API Server (`server.js`)

Express server on port 5002. Endpoints:
- `POST /api/horde/respond` — primary defense endpoint
- `GET /api/horde/responses` — response history with filtering
- `GET /api/horde/status` — cluster activity, uptime, counts
- `GET /api/horde/clusters` — per-cluster statistics
- `GET /` — live dashboard

All defense events are persisted to `horde-data.json` and loaded on startup.

### Dashboard

The dashboard at `http://localhost:5002/` provides:
- Cluster activity bars showing response distribution across all 4 defense postures
- Live response feed with threat levels and consensus scores color-coded by severity
- Interactive API explorer — submit threats and read posture recommendations without curl
- Per-cluster breakdown of historical activation patterns

---

## Product Identity

### The Visual Origin

HORDE's visual identity is the swarm: water molecules clustering under pressure, ants forming a bridge, bees defending the hive. In the 3D game, the 432 blocks don't form linear arms like VIPER — they pack in clustered masses. Mining is collective. The board fills from the center outward as the swarm responds.

The biological parallel is exact: individual nodes in HORDE have no authority. Their value is their vote. A node that finds itself in the top 25% closest to a threat input casts a vote for its cluster. The cluster that wins is the one whose geometric structure most closely matches the threat's signature. This is emergent defense — the posture arises from the distribution, not from any single node's decision.

The HORDE aesthetic — dense green nodes, cluster-based layout, collective consensus output — reflects this. Where VIPER is a scalpel (single closest node, precise vector), HORDE is a shield wall (neighborhood majority, collective posture).

### Mathematical Foundation

The Hurwitz quaternion integers form the densest possible packing of the 4D sphere. The p=17 configuration selects 432 of these points with identical norm. This gives HORDE:

- **Collective stability:** The same neighborhood tends to respond to the same class of threats. The defense posture is reproducible.
- **Conservative by design:** In a uniform distribution, each cluster gets exactly 25% of the neighborhood. No posture is recommended unless the swarm genuinely agrees. This minimizes false alarms.
- **Scale advantage:** 432 nodes across 4 clusters gives more coverage than VIPER's 336 across 4 arms. The neighborhood is larger, the vote is more stable, the geometry is denser.
- **Quantum resistance:** Detection signatures derive from 4D geometry, not learned patterns. No training data to poison, no model to invert.

### Connection to VIPER and THE VAULT™

HORDE is upstream of VIPER in the response chain, downstream in key complexity:

```
THE VAULT  (p=5  — 144 keys)  →  Root of trust, quantum key storage
VIPER      (p=13 — 336 keys)  →  Threat detection, kill chain classification
HORDE      (p=17 — 432 keys)  →  Swarm defense, collective posture recommendation
```

The key count formula is `24 × (p+1)` for prime p. Each step up the prime ladder adds more keys, more coverage, and a denser geometric structure. HORDE is the densest — 432 nodes, the largest neighborhood, the most conservative consensus model.

In the operational pipeline, VIPER detects and HORDE responds. The same input goes to both systems — VIPER returns a kill chain classification; HORDE returns a defense posture. Together they give you both the threat intelligence and the action directive.

---

## Product Tiers

### Colony
- **Coverage:** 1 cluster (108 nodes) — Cluster 0 (SWARM posture) only
- **Use case:** Lightweight first-response — fast initial posture recommendation for known attack patterns
- **Call:** `"tier": "colony"` — checks cluster 0 only, 27-node neighborhood

### Swarm
- **Coverage:** 4 clusters (432 nodes) — full consensus defense
- **Use case:** Standard deployment — complete posture coverage across all 4 defense doctrines
- **Call:** `"tier": "swarm"` (default) — 108-node neighborhood

### Legion *(Enterprise)*
- **Coverage:** Custom cluster selection, adjustable sensitivity per cluster
- **Features:** Webhook alerts, streaming response API, custom defense configurations, multi-tenant API keys
- **Integration:** Vault key injection, VIPER coordination, unified threat-to-response dashboard

---

## The Security Trinity

HORDE is the defense layer in a three-product security stack:

```
THE VAULT™  (game.js     — 144 keys — p=5)   →  Root of trust, key storage
VIPER       (game-336.js — 336 keys — p=13)  →  Threat detection, kill chain classification
HORDE       (game-432.js — 432 keys — p=17)  →  Swarm defense, collective response
```

All three share the same Hurwitz quaternion mathematical foundation, the same crystal surface visual identity, and the same quantum entropy pipeline. THE VAULT provisions the keys. VIPER detects when those keys are under threat. HORDE responds.

The three games were not designed as security products — they emerged as visual explorations of Hurwitz geometry. The discovery that they form a complete security stack (DISCOVERY 42 in RESEARCH_DISCOVERIES.md) is the product insight: the same mathematics that describes crystal lattice packing is the right mathematics for key storage, threat detection, and collective defense.

---

## User Flow

1. **Start HORDE:** `cd horde-api && npm start`
2. **Open the dashboard:** `http://localhost:5002/`
3. **Submit a threat:** POST any suspicious input — security event, log line, behavioral anomaly, raw hash
4. **Read the posture:** Cluster tells you which defense doctrine the swarm recommends. Consensus score tells you how strongly the swarm agrees. Cluster breakdown shows the full vote distribution.
5. **Watch the dashboard:** Cluster bars grow as responses accumulate. The dominant posture over time tells you what kind of defense your threat environment is calling for.
6. **Pair with VIPER:** Run the same input through both. VIPER tells you what the threat is doing. HORDE tells you how to respond. Use both together for full situational awareness and action directives.
7. **Integrate:** Wire `POST /api/horde/respond` into your SIEM, incident response playbook, or security automation. HORDE returns structured JSON with posture, consensus score, and full cluster breakdown — drop it into any downstream system.

---

## Future

- **Quantum-seeded node signatures** — replace SHA-256 derived key hashes with IBM hardware entropy via THE VAULT pipeline, rotating the defense surface with each hardware run
- **VIPER coordination** — automatic HORDE trigger when VIPER detects BREACH or LATERAL above threshold
- **Streaming mode** — continuous input stream with real-time posture updates as the neighborhood vote evolves
- **Legion tier** — per-cluster sensitivity, webhook alerting, multi-tenant keys, custom cluster configurations
- **Visualization integration** — live `game-432.js` board updates driven by API response events — nodes light up in real time as the swarm responds
- **Posture memory** — track posture recommendations over time windows to detect shifts in the threat landscape before individual events escalate

---

## More Information

- **API reference:** [README.md](README.md)
- **User guide:** [HORDE_USER_GUIDE.md](HORDE_USER_GUIDE.md)
- **Security Trinity:** [../vault-api/THE_VAULT.md](../vault-api/THE_VAULT.md)
- **Research background:** [RESEARCH_DISCOVERIES.md](../../RESEARCH_DISCOVERIES.md) — Discovery 42
