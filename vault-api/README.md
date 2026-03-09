# THE VAULT™ API

Minimal backend for THE VAULT™: 81-slot key store, store/request API, API key auth, audit log.

## Run

```bash
cd vault-api
npm install
npm start
```

Optional env: `PORT=5003`, `VAULT_API_KEY=your-secret`, `VAULT_KEY_SEED=your-seed`.

## Endpoints

- `GET /api/vault/health` — Health and slot count (no auth).
- `GET /api/vault/slots` — List slot indices that have stored payloads (no auth).
- `POST /api/vault/store` — Store encrypted payload in a slot. Body: `{ slotIndex: 0..80, encryptedPayload: string }`. Header: `X-Vault-Api-Key`.
- `POST /api/vault/request` — Request key release for a slot. Body: `{ slotIndex: 0..80 }`. Header: `X-Vault-Api-Key`. Returns `keyMaterial` and `hasPayload`.
- `GET /api/vault/audit?limit=100` — Recent audit log (auth required).

## Auth

API key via header `X-Vault-Api-Key` or body `apiKey`. Default demo key: `vault-demo-key-change-in-production`. Set `VAULT_API_KEY` in production.

## Key material

Demo: each of the 81 slots gets a deterministic key from `VAULT_KEY_SEED` + slot index (SHA-256). Production: plug in SHQKD/Echo key material per slot.
