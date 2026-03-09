# THE VAULT™ API

> Minimal backend for **THE VAULT™**: 81-slot key store, store/request API, API key auth, audit log.

---

## Run

```bash
cd vault-api
npm install
npm start
```

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

## Auth

API key via header **`X-Vault-Api-Key`** or body **`apiKey`**.  
Default demo key: `vault-demo-key-change-in-production`. Set **`VAULT_API_KEY`** in production.

---

## Key material

- **Demo:** Each of the 81 slots gets a deterministic key from `VAULT_KEY_SEED` + slot index (SHA-256).
- **Production:** Plug in SHQKD/Echo key material per slot.
