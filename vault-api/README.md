# THE VAULT™ API

> Minimal backend for **THE VAULT™**: 81-slot key store, store/request API, API key auth, audit log.

**User guide:** [VAULT_USER_GUIDE.md](VAULT_USER_GUIDE.md) — how to run the API, use the 3D game, store/request, configs, and troubleshooting.

---

## Run

```bash
cd vault-api
npm install
npm start
```

**Test (with server running in another terminal):** `npm test`

**Optional env:** `PORT=5003` · `VAULT_API_KEY=your-secret` · `VAULT_KEY_SEED=your-seed`

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/vault/health` | — | Health and slot count |
| `GET`  | `/api/vault/slots`  | — | List slot indices with stored payloads |
| `POST` | `/api/vault/store`  | Key | Store encrypted payload in a slot |
| `POST` | `/api/vault/request` | Key | Request key release; returns `keyMaterial`, `hasPayload` |
| `GET`  | `/api/vault/audit?limit=100` | Key | Recent audit log |
| `GET`  | `/api/vault/configs` | Key | List configs |
| `GET`  | `/api/vault/configs/default` | Key | Default config (signature tier) |
| `GET`  | `/api/vault/configs/:id` | Key | Get config by id |
| `POST` | `/api/vault/configs` | Key | Create config |
| `PATCH`| `/api/vault/configs/:id` | Key | Update config |
| `DELETE`| `/api/vault/configs/:id` | Key | Delete config (not default) |

**Store/Request body:** `slotIndex` (0..80); store also accepts `encryptedPayload`.  
**Header:** `X-Vault-Api-Key`

---

## How to use store

**Store** saves an encrypted payload in one of the 81 slots. The API does **not** encrypt for you: you send ciphertext (e.g. base64). Typical flow:

1. **Request the key** for a slot (so you have the key material to encrypt with, or use it for reference).
2. **Encrypt your secret** with that key (client-side or your own service). Demo: the slot key is deterministic from `VAULT_KEY_SEED` + slot index (SHA-256 hex).
3. **Store** the ciphertext in that slot.
4. Later, **request** the key again to decrypt the payload.

**curl examples** (API running at `http://localhost:5003`, demo key):

```bash
# Store a payload in slot 0 (any string or base64; API stores it as-is)
curl -X POST http://localhost:5003/api/vault/store \
  -H "Content-Type: application/json" \
  -H "X-Vault-Api-Key: vault-demo-key-change-in-production" \
  -d '{"slotIndex": 0, "encryptedPayload": "dGVzdA=="}'

# See which slots have payloads
curl -s http://localhost:5003/api/vault/slots
# → {"slots":81,"filled":[0]}

# Request key for slot 0; response includes hasPayload: true
curl -X POST http://localhost:5003/api/vault/request \
  -H "Content-Type: application/json" \
  -H "X-Vault-Api-Key: vault-demo-key-change-in-production" \
  -d '{"slotIndex": 0}'
```

The 3D game (THE VAULT page) currently only does **request** (key release) when you click a block; there is no Store UI yet. Use the API or your own client to call `POST /api/vault/store`.

---

## Auth

API key via header **`X-Vault-Api-Key`** or body **`apiKey`**.  
Default demo key: `vault-demo-key-change-in-production`. Set **`VAULT_API_KEY`** in production.

---

## Key material

- **Demo:** Each of the 81 slots gets a deterministic key from `VAULT_KEY_SEED` + slot index (SHA-256).
- **Production:** Plug in SHQKD/Echo key material per slot.
