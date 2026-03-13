# HORDE — User Guide

HORDE is a quantum-backed swarm defense system built on 432 Hurwitz quaternion keys arranged in 4 defense clusters. Each cluster maps to a defensive posture. Submit any threat input — a log line, security event, behavioral signature, or raw hash — and the swarm collectively votes on the appropriate defense response.

The 3D game (`game-432.js`) is the visual interface. The API is the product. Mining a block in the game is the same as triggering a swarm response — each block is a defense node, and the cluster its ore belongs to tells you which posture the swarm recommends.

---

## Starting HORDE

```bash
cd horde-api
npm install   # first time only
npm start
```

Open **http://localhost:5002/** to see the dashboard:
- **Cluster activity bars** — live activation counts across all 4 defense clusters
- **Recent responses** — last 10 events with threat level, posture, consensus score, node counts
- **Stats** — total responses, critical/high count, active tier
- **API explorer** — interactive panels for every endpoint

---

## The Defense Model

### The 4 Defense Clusters

HORDE's 432 defense nodes are arranged in 4 clusters of 108 keys each. Each cluster corresponds to a defense doctrine:

| Cluster | Posture | Direction | What It Recommends |
|---------|---------|-----------|-------------------|
| 0 | **SWARM** | +X | Deploy mass response — activate all available defense nodes, overwhelming force |
| 1 | **SHIELD** | -X | Form protective perimeter — isolate assets, defensive clustering around critical systems |
| 2 | **TRACE** | +Z | Persistent tracking — do not alert the attacker, maintain covert surveillance |
| 3 | **ADAPT** | -Z | Update defense posture — rotate signatures, patch surface area, harden against the detected vector |

### How a Swarm Response Works

1. Your threat input is hashed with SHA-256 — the input itself is never stored, only its hash
2. The hash is compared against all 432 Hurwitz p=17 quaternion key hashes using Hamming distance
3. The top 25% closest nodes (108 nodes for full swarm tier) form the response neighborhood
4. Votes are counted per cluster — the cluster with the most nodes in the neighborhood wins
5. Consensus score = `winning cluster nodes / neighborhood size`
6. Threat level is derived from consensus strength adjusted by sensitivity

The Hurwitz quaternion keys are maximally separated 4D coordinates. This geometric separation means that similar threat inputs tend to cluster to the same neighborhood — and therefore the same cluster — making the collective vote stable and meaningful.

### Why Consensus Instead of Closest Node

VIPER uses the closest single node (precision targeting). HORDE uses neighborhood consensus (collective agreement). This is the fundamental difference:

- **VIPER:** "This input is closest to node 156. Node 156 is in the BREACH arm. Threat detected."
- **HORDE:** "108 nodes respond. SHIELD wins with 34 votes (32% consensus). Recommended posture: SHIELD."

HORDE is designed for *defense recommendations*, not *threat classification*. The swarm vote provides a confidence-weighted posture that accounts for the distribution of the threat across the full key space — not just its closest single point.

### Understanding Consensus Scores

| Consensus Score | Interpretation |
|-----------------|----------------|
| 0.25 | Uniform — no dominant cluster, all roughly equal |
| 0.30–0.35 | Weak cluster lean — NOMINAL or LOW threat |
| 0.35–0.45 | Moderate consensus — LOW to MEDIUM threat |
| 0.45–0.55 | Strong consensus — MEDIUM to HIGH threat |
| 0.55+ | High consensus — HIGH to CRITICAL threat |

In a perfectly uniform distribution, each cluster gets exactly 25% of the neighborhood. HORDE only escalates when the swarm genuinely agrees — this makes it conservative by design and resistant to false positives.

### Threat Levels

| Level | Meaning |
|-------|---------|
| `NOMINAL` | Swarm distributed — no cluster alignment, no clear defense trigger |
| `LOW` | Weak cluster lean — monitor, no immediate action |
| `MEDIUM` | Moderate consensus — defensive measures advisable |
| `HIGH` | Strong consensus — activate recommended posture |
| `CRITICAL` | Very high consensus — immediate full posture activation |

---

## Running Your First Response

### From the Dashboard

1. Open the **POST /api/horde/respond** panel in the API explorer
2. The API key is pre-filled
3. Enter any threat data in the text area — a log event, anomaly description, IP, or behavioral signature
4. Select your tier (`swarm` for full coverage)
5. Click **Activate Swarm**
6. The response appears inline showing threat level, defense posture, consensus score, and full cluster breakdown

### From the Terminal

```bash
# Submit a suspicious event
curl -X POST http://localhost:5002/api/horde/respond \
  -H "Content-Type: application/json" \
  -H "X-Horde-Api-Key: horde-demo-key-change-in-production" \
  -d '{
    "input": "suspicious outbound traffic 450MB 3:00AM unusual destination",
    "tier": "swarm",
    "sensitivity": 0.5
  }'

# Check response history
curl -s "http://localhost:5002/api/horde/responses?limit=20" \
  -H "X-Horde-Api-Key: horde-demo-key-change-in-production"

# Filter by threat level
curl -s "http://localhost:5002/api/horde/responses?level=HIGH" \
  -H "X-Horde-Api-Key: horde-demo-key-change-in-production"

# Check cluster stats
curl -s "http://localhost:5002/api/horde/clusters" \
  -H "X-Horde-Api-Key: horde-demo-key-change-in-production"
```

---

## Tiers

**Colony** — single cluster, Cluster 0 (SWARM posture) only. Use for lightweight first-response scenarios where you want a fast initial recommendation without full consensus.

**Swarm** — all 4 clusters, full 4-cluster consensus. The default. Every response checks all 432 nodes and counts the full neighborhood vote.

**Legion** *(enterprise, coming soon)* — custom cluster selection, webhook alerts, streaming mode, VIPER integration, custom sensitivity per cluster.

To switch tiers, pass `"tier": "colony"` or `"tier": "swarm"` in your request. No server restart needed — tier is per-request.

---

## The VIPER + HORDE Pipeline

VIPER detects. HORDE responds. Together they form the operational security core of the STEADYWATCH platform:

```
VIPER scan → detect threat vector → HORDE respond → determine defense posture
```

**Example workflow:**

1. VIPER classifies a log event as `LATERAL` at `HIGH` threat level
2. Feed the same input to HORDE: `POST /api/horde/respond`
3. HORDE swarm consensus recommends `TRACE` (covert surveillance) with 41% consensus
4. Defense recommendation: do not alert — maintain surveillance on the pivot

This separation is intentional. VIPER tells you *what* the threat is doing (kill chain phase). HORDE tells you *how* to respond (defense posture). Combining them gives you both the threat intelligence and the action directive.

---

## Using the 3D Game as a Visualization

`game-432.js` is HORDE's visual interface. Each of the 432 blocks on the board corresponds to one defense node. The 4 clusters of the board are the 4 defense postures.

Unlike VIPER's linear arm layout, HORDE's game board reflects the swarm structure — nodes are packed in clustered formations rather than directional arms. This mirrors the consensus model: HORDE doesn't point in one direction, it forms a collective majority.

Running HORDE alongside the game gives you a live spatial visualization of the swarm's response distribution — the entire board is active, with the dominant cluster emerging from the collective node density.

---

## Resetting Response History

```bash
# Stop the server, delete history, restart
rm horde-data.json
npm start
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5002 already in use | `PORT=5003 npm start` |
| 401 Unauthorized | Check `X-Horde-Api-Key` matches `HORDE_API_KEY` env |
| All responses return NOMINAL | Expected — uniform threat distributions produce even cluster splits; try higher `sensitivity` or inputs with stronger patterns |
| Consensus score always near 0.25 | This is correct for genuinely ambiguous inputs — HORDE is conservative by design |
| VIPER says CRITICAL, HORDE says NOMINAL | Not a contradiction — VIPER sees a sharp single-node match; HORDE sees the full neighborhood distribution. Different detection models, different signals |

---

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express API server + dashboard |
| `horde-engine.js` | Hurwitz p=17 key generation, 432-node defense matrix, swarm consensus engine |
| `test-api.js` | Smoke tests (`npm test`) |
| `horde-data.json` | Live response history (gitignored) |
| `README.md` | API reference |
| `THE_HORDE.md` | Product architecture and vision |
