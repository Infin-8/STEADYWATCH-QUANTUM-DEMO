# THE VAULT™ — User Guide

This guide explains how to run and use THE VAULT™: the 81-slot key store, the 3D Keyz board, and the API.

---

## Quick start

1. **Start the API** (in a terminal):
   ```bash
   cd vault-api
   npm install
   npm start
   ```
   The API runs at `http://localhost:5003` by default.

2. **Open THE VAULT page** in your browser:
   - Locally: open `game.html` from the demo (e.g. `http://localhost:8080/game.html` if you serve the folder).
   - Live: [STEADYWATCH-QUANTUM-DEMO](https://infin-8.github.io/STEADYWATCH-QUANTUM-DEMO/game.html) (VAULT™ link).

3. **Load default config** (optional): On THE VAULT page, use the controls under the 3D view. Click **Load default config**. If the API is running locally and the page is loaded over HTTP, it fetches the signature config; otherwise it uses the built-in default so the panel always shows the config (key at 0, 144 Hurwitz moat, unlocked key moat).

---

## What THE VAULT does

- **81 slots** — Each slot holds key material (and optionally an encrypted payload). Slots are indexed 0–80 and map to the 9×9 Keyz board.
- **Request key** — You request key release for a slot; the API returns the key material (and whether that slot has a stored payload). In the 3D game, clicking a key ore block does this when the Vault API is configured.
- **Store payload** — You can store an encrypted payload in a slot via the API. The API does not encrypt or decrypt; you send ciphertext and use the slot key yourself to encrypt/decrypt.
- **Configs** — Named key configurations (e.g. signature tier: key at slot 0, 144 Hurwitz moat, unlocked key moat). You can list and load them via the API or the “Load default config” button.

---

## Using the 3D game (THE VAULT page)

- **Mine blocks** — Click a glowing key ore block. The block is removed and a key drop (orb cluster) appears. This is the same Keyz game behavior.
- **Vault API** — The viz controls panel under the game has an optional **API base URL** and **API key**. If you run the API locally and open the page over **HTTP** (e.g. `http://localhost:...`), set the base to `http://localhost:5003` and the key to `vault-demo-key-change-in-production`. Then clicking a key ore block also sends a key-release request to the API and shows “Key released for slot N” (or an error).
- **Load default config** — Fills the panel with the signature config (Config name, Tier, Crown slot, Moat). Works even when the API is not reachable (uses a built-in default). If the API is reachable, it uses the config from the API.
- **HTTPS vs HTTP** — If you open THE VAULT page from an HTTPS site (e.g. GitHub Pages), the browser will not allow requests to `http://localhost:5003` (mixed content). In that case the 3D game and “Load default config” still work; key release to the API only works if you use an HTTPS API URL or open the page from HTTP (e.g. run the demo locally).

---

## Using the API

### Authentication

Send your API key in the header:

```http
X-Vault-Api-Key: vault-demo-key-change-in-production
```

Demo default key: `vault-demo-key-change-in-production`. Set `VAULT_API_KEY` when starting the server to use your own key.

### Health and slots (no auth)

- **Health:** `GET /api/vault/health` — Returns `{ "status": "ok", "slots": 81 }`.
- **Slots:** `GET /api/vault/slots` — Returns `{ "slots": 81, "filled": [0, 1, ...] }` (indices of slots that have a stored payload).

### Request key release (auth required)

- **Endpoint:** `POST /api/vault/request`
- **Body:** `{ "slotIndex": 0 }` (0–80)
- **Response:** `{ "ok": true, "slotIndex": 0, "keyReleased": true, "keyMaterial": "<hex>", "hasPayload": false }`

Use `keyMaterial` to decrypt a payload you stored in that slot (or for your own crypto). `hasPayload` is `true` if something was stored with **Store**.

### Store a payload (auth required)

- **Endpoint:** `POST /api/vault/store`
- **Body:** `{ "slotIndex": 0, "encryptedPayload": "<base64 or string>" }`
- **Response:** `{ "ok": true, "slotIndex": 0 }`

The API stores your ciphertext as-is; it does not encrypt. You should encrypt your secret with the slot key (from a previous **Request** or from your own derivation) before sending.

**Example (curl):**

```bash
curl -X POST http://localhost:5003/api/vault/store \
  -H "Content-Type: application/json" \
  -H "X-Vault-Api-Key: vault-demo-key-change-in-production" \
  -d '{"slotIndex": 0, "encryptedPayload": "dGVzdA=="}'
```

### Configs (auth required)

- **Default config:** `GET /api/vault/configs/default` — Returns the signature config (key at 0, 144 Hurwitz moat, unlocked key moat).
- **List configs:** `GET /api/vault/configs` — Returns `{ "configs": [...] }`.
- **Get one:** `GET /api/vault/configs/:id`
- **Create:** `POST /api/vault/configs` with body `{ "name": "...", "tier": "...", "crownSlotIndex": 0, "moatLayers": [...], "slotRoles": {} }`
- **Update:** `PATCH /api/vault/configs/:id` (signature config cannot be modified)
- **Delete:** `DELETE /api/vault/configs/:id` (signature config cannot be deleted)

### Audit log (auth required)

- **Endpoint:** `GET /api/vault/audit?limit=100`
- **Response:** `{ "audit": [ { "ts": "...", "action": "store"|"request", "slotIndex": 0, "apiKeyId": "..." }, ... ] }`

---

## Testing the API

With the API running in one terminal:

```bash
cd vault-api
npm test
```

This runs smoke tests for health, slots, configs/default, request, store, and audit. All should pass.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Load default config” does nothing or shows error on the live site | Normal when the page is on HTTPS: the browser blocks requests to `http://localhost`. The button still loads the **built-in** default config into the panel. To use the live API, you’d need an HTTPS API URL. |
| Key release fails from the 3D game | Ensure the API is running (`npm start`), the base URL is correct (e.g. `http://localhost:5003`), and the page is loaded over HTTP if you’re calling an HTTP API. Check the API key. |
| Store/request return 401 | Add the header `X-Vault-Api-Key` with the same value as `VAULT_API_KEY` (or the demo key). |
| Port 5003 already in use | Stop the other process using 5003 or set `PORT=5004 npm start` (then use port 5004 in the base URL). |

---

## More information

- **API reference:** [README.md](README.md)
- **Product and architecture:** [THE_VAULT.md](THE_VAULT.md)
- **Configs API sketch:** [VAULT_CONFIGS_API_SKETCH.md](VAULT_CONFIGS_API_SKETCH.md)
- **Operations and compliance:** [../docs/VAULT_OPS.md](../docs/VAULT_OPS.md)
