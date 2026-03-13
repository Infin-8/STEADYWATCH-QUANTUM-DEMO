# VIPER API

> 336-key Hurwitz quaternion threat detection. Classifies any input signature
> against 4 kill chain vectors — RECON, BREACH, LATERAL, EXFIL.
> The 3D game board is the visual interface; the API is the product.

---

## Quick Start

```bash
cd viper-api
npm install
npm start
```

Open **http://localhost:5001/** — the dashboard shows live vector activity, recent detections, threat levels, and an interactive API explorer.

---

## How Detection Works

Every scan hashes the input with SHA-256 and measures Hamming distance against all 336 Hurwitz p=13 quaternion keys. The closest node determines the kill chain vector and threat classification.

```
input → SHA-256(input) → Hamming distance × 336 keys → closest node → vector + threat level
```

The 4 arms map to the attack kill chain:

| Arm | Direction | Vector | Description |
|-----|-----------|--------|-------------|
| 0 | +X | **RECON** | Reconnaissance — scanning, probing, enumeration |
| 1 | -X | **BREACH** | Initial Access — exploitation, credential abuse |
| 2 | +Z | **LATERAL** | Lateral Movement — privilege escalation, pivoting |
| 3 | -Z | **EXFIL** | Exfiltration — data theft, C2 communication |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | — | Live dashboard with API explorer |
| `GET`  | `/api/viper/health` | — | Health check |
| `GET`  | `/api/viper/status` | Key | Arm stats, detection counts, uptime |
| `POST` | `/api/viper/scan` | Key | Classify input — returns vector, threat level, confidence |
| `GET`  | `/api/viper/alerts?limit=N&level=HIGH` | Key | Detection log with optional filters |
| `GET`  | `/api/viper/vectors` | Key | Per-arm stats and detection counts |

**Auth header:** `X-Viper-Api-Key: <key>`
**Default demo key:** `viper-demo-key-change-in-production`
**Change it:** Set `VIPER_API_KEY` env variable before starting.

---

## Scan Request

```json
POST /api/viper/scan
{
  "input": "192.168.1.100 GET /admin/config HTTP/1.1",
  "tier": "strike",
  "sensitivity": 0.5
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `input` | string | required | Any data: IP, log line, hash, event, payload |
| `tier` | string | `strike` | `scout` (1 arm, RECON only) or `strike` (all 4 arms) |
| `sensitivity` | float | `0.5` | 0.0–1.0 — shifts threat level thresholds |

**Response:**
```json
{
  "inputHash": "2dcb89a7…",
  "threatLevel": "LOW",
  "confidence": 0.582,
  "vector": "BREACH",
  "vectorDescription": "Initial Access — exploitation, credential abuse",
  "arm": 1,
  "nodeIndex": 156,
  "posInArm": 72,
  "quaternion": { "a": 1.5, "b": 1.5, "c": 1.5, "d": 2.5 },
  "matches": [
    { "nodeIndex": 156, "arm": 1, "vector": "BREACH", "distance": 107, "confidence": 0.582 },
    { "nodeIndex": 250, "arm": 2, "vector": "LATERAL", "distance": 108, "confidence": 0.578 }
  ],
  "tier": "strike",
  "ts": "2026-03-13T02:02:39.851Z"
}
```

**Threat levels:** `NOMINAL` → `LOW` → `MEDIUM` → `HIGH` → `CRITICAL`

---

## Tiers

| Tier | Arms | Keys | Use Case |
|------|------|------|----------|
| **Scout** | 1 | 84 | RECON vector only — lightweight monitoring |
| **Strike** | 4 | 336 | Full kill chain coverage |
| **Phantom** | custom | custom | Enterprise — webhooks, custom sensitivity, streaming |

---

## Persistence

Detection history is saved to `viper-data.json` after every scan. Loaded automatically on startup — alert history survives restarts.

`viper-data.json` is gitignored. Delete it to reset history.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Server port |
| `VIPER_API_KEY` | `viper-demo-key-change-in-production` | API key for auth |

---

## Testing

```bash
# With the server running in another terminal:
npm test
```
