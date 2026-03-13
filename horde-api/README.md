# HORDE API

> 432-key Hurwitz quaternion swarm defense. Runs collective consensus across 4 defense clusters
> to determine the appropriate defensive posture for any threat input.
> The 3D game board is the visual interface; the API is the product.

---

## Quick Start

```bash
cd horde-api
npm install
npm start
```

Open **http://localhost:5002/** — the dashboard shows live cluster activity, recent responses, defense postures, and an interactive API explorer.

---

## How Swarm Defense Works

Every threat submission hashes the input with SHA-256 and measures Hamming distance against all 432 Hurwitz p=17 quaternion keys. The top 25% closest nodes form a neighborhood. The cluster with the most nodes in that neighborhood wins — its defense posture is the collective response.

```
input → SHA-256(input) → Hamming distance × 432 keys → top 25% neighborhood → cluster vote → defense posture
```

The 4 clusters map to defense postures:

| Cluster | Direction | Posture | Description |
|---------|-----------|---------|-------------|
| 0 | +X | **SWARM** | Mass collective response — overwhelming coordinated force |
| 1 | -X | **SHIELD** | Protective formation — defensive clustering around assets |
| 2 | +Z | **TRACE** | Persistent tracking — hunting and containing the threat |
| 3 | -Z | **ADAPT** | Adaptive defense — learning, updating, hardening posture |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | — | Live dashboard with API explorer |
| `GET`  | `/api/horde/health` | — | Health check |
| `GET`  | `/api/horde/status` | Key | Cluster stats, response counts, uptime |
| `POST` | `/api/horde/respond` | Key | Submit threat — returns defense posture, consensus score, threat level |
| `GET`  | `/api/horde/responses?limit=N&level=HIGH` | Key | Response log with optional filters |
| `GET`  | `/api/horde/clusters` | Key | Per-cluster stats and activation counts |

**Auth header:** `X-Horde-Api-Key: <key>`
**Default demo key:** `horde-demo-key-change-in-production`
**Change it:** Set `HORDE_API_KEY` env variable before starting.

---

## Respond Request

```json
POST /api/horde/respond
{
  "input": "suspicious outbound traffic 450MB 3:00AM unusual destination",
  "tier": "swarm",
  "sensitivity": 0.5
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `input` | string | required | Any data: log line, event, IP, hash, behavioral signature |
| `tier` | string | `swarm` | `colony` (cluster 0 only) or `swarm` (all 4 clusters) |
| `sensitivity` | float | `0.5` | 0.0–1.0 — shifts threat level thresholds |

**Response:**
```json
{
  "inputHash": "a3f72b1c…",
  "threatLevel": "MEDIUM",
  "consensusScore": 0.3148,
  "proximity": 0.5234,
  "defensePosture": "SHIELD",
  "postureDescription": "Protective formation — defensive clustering around assets",
  "defenseAction": "Form protective perimeter — isolate assets and cluster defenses",
  "winningCluster": 1,
  "neighborhoodSize": 108,
  "respondingNodes": 34,
  "clusterBreakdown": [
    { "cluster": 0, "name": "SWARM",  "respondingNodes": 28, "proportion": 0.259 },
    { "cluster": 1, "name": "SHIELD", "respondingNodes": 34, "proportion": 0.315 },
    { "cluster": 2, "name": "TRACE",  "respondingNodes": 25, "proportion": 0.231 },
    { "cluster": 3, "name": "ADAPT",  "respondingNodes": 21, "proportion": 0.194 }
  ],
  "tier": "swarm",
  "ts": "2026-03-11T04:00:00.000Z"
}
```

**Threat levels:** `NOMINAL` → `LOW` → `MEDIUM` → `HIGH` → `CRITICAL`

---

## Tiers

| Tier | Clusters | Keys | Use Case |
|------|----------|------|----------|
| **Colony** | 1 | 108 | Cluster 0 (SWARM) only — lightweight first-response |
| **Swarm** | 4 | 432 | Full 4-cluster consensus — complete defense coverage |
| **Legion** | custom | custom | Enterprise — webhooks, VIPER integration, streaming |

---

## Understanding Consensus

HORDE is more conservative than VIPER by design. In a uniform threat distribution, each cluster gets roughly 25% of the neighborhood — no dominant posture, NOMINAL threat level. High consensus (40%+) means the swarm strongly agrees on a single posture. This is intentional: HORDE only escalates when the collective signal is clear.

```
consensusScore = respondingNodes / neighborhoodSize
```

A consensusScore above 0.40 indicates cluster alignment. Above 0.50 is a strong signal.

---

## Persistence

Response history is saved to `horde-data.json` after every submission. Loaded automatically on startup — defense history survives restarts.

`horde-data.json` is gitignored. Delete it to reset history.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5002` | Server port |
| `HORDE_API_KEY` | `horde-demo-key-change-in-production` | API key for auth |

---

## Testing

```bash
# With the server running in another terminal:
npm test
```
