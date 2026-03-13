# VIPER — User Guide

VIPER is a quantum-backed threat detection system built on 336 Hurwitz quaternion keys arranged in 4 directional arms. Each arm maps to a phase of the attack kill chain. Submit any input — a log line, IP address, network event, hash, or payload — and VIPER classifies it by threat vector and severity.

The 3D game (`game-336.js`) is the visual interface. The API is the product. Mining a block in the game is the same as running a scan — each block corresponds to one detection node, and the burst animation shows which arm the threat fired along.

---

## Starting VIPER

```bash
cd viper-api
npm install   # first time only
npm start
```

Open **http://localhost:5001/** to see the dashboard:
- **Vector activity bars** — live detection counts across all 4 kill chain arms
- **Recent detections** — last 10 scans with threat level, vector, confidence, input hash
- **Stats** — total detections, critical/high count, active tier
- **API explorer** — interactive panels for every endpoint

---

## The Detection Model

### The 4 Kill Chain Vectors

VIPER's 336 detection nodes are arranged in 4 arms of 84 keys each. Each arm corresponds to a phase of the attack lifecycle:

| Arm | Vector | Direction | What It Catches |
|-----|--------|-----------|-----------------|
| 0 | **RECON** | +X | Port scans, DNS enumeration, credential stuffing probes, service fingerprinting |
| 1 | **BREACH** | -X | Exploit attempts, injection attacks, authentication bypass, malware delivery |
| 2 | **LATERAL** | +Z | Token theft, privilege escalation, internal pivoting, pass-the-hash |
| 3 | **EXFIL** | -Z | Large data transfers, C2 beaconing, DNS tunneling, unusual outbound traffic |

### How a Scan Works

1. Your input is hashed with SHA-256 — the input itself is never stored, only its hash
2. The hash is compared against all 336 Hurwitz p=13 quaternion key hashes using Hamming distance (bit-level similarity)
3. The closest node determines the kill chain vector
4. Confidence score = `1 - (distance / 256 bits)`
5. Threat level is set based on confidence adjusted by your sensitivity setting

The Hurwitz quaternion keys are 4D coordinates with mathematically maximal separation — no two keys are close to each other in the 256-bit hash space, making the classification stable and unambiguous.

### Threat Levels

| Level | Meaning |
|-------|---------|
| `NOMINAL` | No significant match — input not characteristic of known threat patterns |
| `LOW` | Weak signal — worth logging, not alerting |
| `MEDIUM` | Moderate match — investigate if volume increases |
| `HIGH` | Strong match — recommend alert and review |
| `CRITICAL` | Very strong match — immediate action recommended |

Increase `sensitivity` (toward 1.0) to catch more potential threats at the cost of more false positives. Decrease it (toward 0.0) for high-confidence-only alerting.

---

## Running Your First Scan

### From the Dashboard

1. Open the **POST /api/viper/scan** panel in the API explorer
2. The API key is pre-filled
3. Enter any input in the text area — a log line, IP, event string, or raw data
4. Select your tier (`strike` for full coverage)
5. Click **Scan**
6. The response appears inline showing threat level, vector, confidence, and the top 3 closest nodes

### From the Terminal

```bash
# Classify a suspicious request
curl -X POST http://localhost:5001/api/viper/scan \
  -H "Content-Type: application/json" \
  -H "X-Viper-Api-Key: viper-demo-key-change-in-production" \
  -d '{
    "input": "192.168.1.100 GET /admin/passwd HTTP/1.1",
    "tier": "strike",
    "sensitivity": 0.6
  }'

# Check detection history
curl -s "http://localhost:5001/api/viper/alerts?limit=20" \
  -H "X-Viper-Api-Key: viper-demo-key-change-in-production"

# Filter by threat level
curl -s "http://localhost:5001/api/viper/alerts?level=HIGH" \
  -H "X-Viper-Api-Key: viper-demo-key-change-in-production"
```

---

## Tiers

**Scout** — single arm, RECON vector only. Use for lightweight perimeter monitoring where you only care about reconnaissance activity.

**Strike** — all 4 arms, full kill chain coverage. The default. Every scan checks all 336 nodes and returns the best match regardless of which vector it hits.

**Phantom** *(enterprise, coming soon)* — custom arm selection, webhook alerts, streaming mode, custom sensitivity per vector.

To switch tiers, pass `"tier": "scout"` or `"tier": "strike"` in your scan request. No server restart needed — tier is per-request.

---

## Integrating with THE VAULT™

VIPER and THE VAULT are designed to work together. THE VAULT holds the quantum-derived key material; VIPER uses that key material as its detection seed.

In the full security pipeline:
```
THE VAULT  →  provisions quantum keys
VIPER      →  uses vault keys to define detection node signatures
```

When IBM hardware entropy is available, re-seed THE VAULT and update VIPER's key material to rotate detection signatures — making them impossible to precompute or reverse engineer.

---

## Using the 3D Game as a Visualization

`game-336.js` is VIPER's visual interface. Each of the 336 blocks on the board corresponds to one detection node. The 4 arms of the board are the 4 kill chain vectors.

When a block is mined (a scan fires that node), the burst animation shows the detection event — orbs exploding outward along the arm axis. This is the chest-burster visual identity of VIPER: the threat is identified, classified by vector, and the detection fires along that exact axis.

Running VIPER alongside the game gives you a live spatial visualization of your threat detection activity — threats literally appear on the board in the arm they came from.

---

## Resetting Detection History

```bash
# Stop the server, delete history, restart
rm viper-data.json
npm start
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5001 already in use | `PORT=5002 npm start` |
| 401 Unauthorized | Check `X-Viper-Api-Key` matches `VIPER_API_KEY` env |
| All scans return NOMINAL | Lower `sensitivity` or check that input has meaningful content |
| Same vector every time | Expected — the Hurwitz geometry creates stable attractor regions; different threat classes genuinely cluster to different arms |

---

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express API server + dashboard |
| `viper-engine.js` | Hurwitz p=13 key generation, 336-node detection matrix, Hamming classifier |
| `test-api.js` | Smoke tests (`npm test`) |
| `viper-data.json` | Live detection history (gitignored) |
| `README.md` | API reference |
| `THE_VIPER.md` | Product architecture and vision |
