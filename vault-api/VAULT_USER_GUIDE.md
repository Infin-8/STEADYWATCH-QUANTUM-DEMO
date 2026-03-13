# THE VAULT™ — User Guide

THE VAULT™ is a quantum-backed key store where the 9×9 Hurwitz Quaternion game board IS the interface. Each block on the board is a key slot. Mining a block releases the cryptographic key for that slot. The crystal surface you see first is the vault door — you must rotate the board to see what's beneath.

---

## Starting the Vault

```bash
cd vault-api
npm install   # first time only
npm start
```

The dashboard opens at **http://localhost:5003/**. You'll see:
- **Slot map** — 9×9 grid showing every slot (cyan = crown at slot 0, purple = payload stored)
- **Stats** — total slots, payloads stored, audit count, active config
- **Recent activity** — last 10 store/request actions
- **API explorer** — interactive panels for every endpoint, no curl needed

---

## The Board and Slot Mapping

The 81 blocks on the 9×9 Hurwitz Quaternion board map to vault slots 0–80:

```
slot = (4 - bz) × 9 + (bx + 4)
```

- **Slot 0** — the crown key. This is the identity quaternion position — the center of the key=0 glow, the zero-phase reference of the entire Hurwitz system.
- **Slots 1–80** — guard and orbital slots, arranged across the board in Hurwitz quaternion order.

The **signature config** (default) defines: crown at slot 0 → 144 Hurwitz moat → unlocked key moat.

---

## Seeding with Real Quantum Entropy

By default the vault uses SHA-256 derived demo keys. To load real IBM quantum hardware entropy:

```bash
# 1. Stop the server (Ctrl+C)
# 2. Run the seed script:
node seed-vault.js
# 3. Restart:
npm start
```

After seeding:
- 80 of 81 slots use real ibm_marrakesh hardware entropy (~7.80 bits avg)
- 1 slot uses simulator recovery (satellite 80)
- Every slot is pre-filled with its Hurwitz quaternion key as the stored payload
- The vault starts fully populated — all 81 slots purple in the dashboard

To use a different seed run file:
```bash
node seed-vault.js --source /path/to/seed_run_results.json
```

To preview without writing:
```bash
node seed-vault.js --dry-run
```

---

## Using the Dashboard API Explorer

Every endpoint has an interactive panel in the dashboard. The API key field at the top is pre-filled — change it if you've set a custom `VAULT_API_KEY`.

**Request a key (releasing a slot):**
1. Find the **POST /api/vault/request** panel
2. Enter a slot index (0–80)
3. Click **Send**
4. The response shows `keyMaterial` (64-char hex) and `hasPayload`

**Store a payload:**
1. Find the **POST /api/vault/store** panel
2. Enter the slot index and your encrypted payload (base64 or string)
3. Click **Send**

The API does not encrypt for you — send ciphertext. Use the `keyMaterial` from a request to encrypt/decrypt client-side.

**View audit log:**
- Use the **GET /api/vault/audit** panel, set a limit, click Send
- Every store and request action is logged with timestamp, action, slot index, and API key prefix

---

## Using the 3D Game with the Vault

1. Start the vault server (`npm start`)
2. Open the game (`game.html`) served over HTTP locally
3. In the controls panel under the 3D view, enable **Vault API**, set:
   - Base URL: `http://localhost:5003`
   - API key: `vault-demo-key-change-in-production`
4. Mine a key ore block — the game sends `POST /api/vault/request` for that slot and shows "Key released for slot N"

> **Note:** If you open the game from an HTTPS site (e.g. GitHub Pages), the browser will block requests to `http://localhost`. Run the demo locally over HTTP for full vault integration.

---

## Resetting the Vault

To clear all payloads and audit history and return to a clean state:

```bash
# Stop the server, then:
rm vault-data.json
npm start
```

To reset and re-seed with quantum entropy in one step:

```bash
rm vault-data.json
node seed-vault.js
npm start
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5003 already in use | `PORT=5004 npm start` — update the base URL accordingly |
| 401 Unauthorized | API key mismatch — check `X-Vault-Api-Key` header matches `VAULT_API_KEY` env |
| Dashboard shows 0 payloads after seeding | Server was running during seed — stop it, run `node seed-vault.js`, restart |
| Vault game integration not working from HTTPS | Browser blocks HTTP API calls from HTTPS pages — run demo locally over HTTP |
| `seed-vault.js` says seed file not found | Pass `--source /absolute/path/to/seed_run_results.json` |

---

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express API server + dashboard |
| `seed-vault.js` | Inject IBM quantum entropy into vault slots |
| `test-api.js` | Smoke tests (`npm test`) |
| `vault-data.json` | Live vault state (gitignored — not committed) |
| `README.md` | API reference |
| `THE_VAULT.md` | Product architecture and vision |
| `VAULT_CONFIGS_API_SKETCH.md` | Config system design and tiered packages |
