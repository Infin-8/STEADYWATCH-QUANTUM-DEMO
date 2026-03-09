# THE VAULT™ — Product and Architecture

THE VAULT™ is the quantum-backed vault product layer built on STEADYWATCH Hybrid QKD (SHQKD): an 81-slot key store with a 3D Keyz board as the interface. Clicking a block (“mining”) can request key release for that slot, subject to API key auth and audit.

---

## What it is

- **Concept:** The demo site describes SHQKD as “like an un-hackable vault that nature provides” for digital assets and transactions. THE VAULT makes that concrete: a backend that stores key material in 81 slots and encrypted payloads (optional), and a front end that reuses the 81-block Keyz game so each block corresponds to one slot.
- **81 slots:** Each of the 81 cells on the 9×9 board maps to slot index `0..80` (row = 4 − bz, col = bx + 4, index = row×9 + col in world coordinates).
- **Key material:** Demo mode derives per-slot keys from a seed (SHA-256); production key material should come from SHQKD/Echo Resonance key injection.
- **Access:** Key release is gated by API key auth; all store and request actions are logged in the audit trail.

---

## Architecture

- **Backend (vault-api):** Express server with 81-slot in-memory key store, `POST /api/vault/store` (store encrypted payload), `POST /api/vault/request` (request key release for a slot), `GET /api/vault/slots`, `GET /api/vault/audit`. API key via `X-Vault-Api-Key` (or body). See [README.md](README.md).
- **Front end (game.html + game.js):** 81-block Keyz board unchanged; optional “Vault API” panel (base URL, API key, checkbox). When Vault mode is on and user clicks a key ore block, the game calls `POST /api/vault/request` with the slot index and displays “Key released” or an error.
- **Future:** SHQKD/Echo key injection, persistent key store, HSM, M-of-N or time-lock policy, and compliance (see [VAULT_OPS.md](../docs/VAULT_OPS.md)).

---

## User flow

1. **Run the API:** `cd vault-api && npm install && npm start` (default port 5003).
2. **Open THE VAULT page** (game.html; nav link “VAULT™” or “THE VAULT™”).
3. **Optional — use vault API:** Check “Vault API,” set base URL to `http://localhost:5003` (or your deployment), set API key to `vault-demo-key-change-in-production`.
4. **Click any key ore block:** The block is mined (removed, key drop appears) as usual. If Vault API is enabled, the app also requests key release for that slot and shows “Key released for slot N” or an error in the label and status.

---

## API usage summary

- **Request key release (from UI or any client):**  
  `POST /api/vault/request`  
  Headers: `Content-Type: application/json`, `X-Vault-Api-Key: <key>`  
  Body: `{ "slotIndex": 0 }` (0..80)  
  Response: `{ "ok": true, "slotIndex": 0, "keyReleased": true, "keyMaterial": "<hex>", "hasPayload": false }`

- **Store encrypted payload:**  
  `POST /api/vault/store`  
  Same headers.  
  Body: `{ "slotIndex": 0, "encryptedPayload": "<base64 or string>" }`

- **List slots with payloads:**  
  `GET /api/vault/slots`  
  Response: `{ "slots": 81, "filled": [0, 1, ...] }`

- **Audit log:**  
  `GET /api/vault/audit?limit=100`  
  Requires auth. Returns recent store/request entries.

Full details: [README.md](README.md). Operations and compliance: [VAULT_OPS.md](../docs/VAULT_OPS.md).

---

## Product idea: Custom key configurations → tiered packages

**Concept:** Users utilize the 3D vault interface not only to view and request keys, but to *design* custom key configurations—e.g. which slots form the “moat,” which are symbol blocks, layout and grouping—and save those as named configurations. Those configurations can be offered as **tiered packages** (e.g. Standard / Moat / Symbol / Enterprise custom layout), turning THE VAULT UI into a configurator and differentiator for pricing tiers.

- **Moat:** Configuration where only certain perimeter or guard slots are active; inner slots reserved or gated.
- **Symbol:** Configuration where specific slots map to symbols or roles (e.g. by customer, by asset type).
- **Custom layouts:** Enterprise or power users design and save a full 81-slot layout (which slots exist, how they’re labeled/grouped in the 3D view), then that layout becomes their “package” for key storage and release.

**Implications:** Vault API could support multiple “configs” or “templates” per API key (or per tenant); the 3D game would need a “design mode” or configurator flow to create and name configurations, then attach them to a tier or product SKU. Backend: store config metadata (slot roles, labels, moat/symbol rules) and optionally restrict store/request by config.

**Preferred config (signature tier):** Key at slot index **0**, **144 Hurwitz moat**, then **unlocked key moat**. See [VAULT_CONFIGS_API_SKETCH.md](VAULT_CONFIGS_API_SKETCH.md) for API sketch and one-pager.
