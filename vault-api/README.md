# THE VAULT™ API

> 81-slot quantum-backed key store. Each slot maps to one block on the 9×9 Hurwitz Quaternion board.
> Mining a block in the 3D game = requesting the cryptographic key for that slot.

---

## Quick Start

```bash
cd vault-api
npm install
npm start
```

Open **http://localhost:5003/** — the dashboard shows vault status, the slot map, and a live API explorer for every endpoint.

---

## Seeding with Quantum Entropy

The vault ships with demo keys (SHA-256 derived). To inject real IBM hardware entropy:

```bash
# Stop the server first, then:
node seed-vault.js

# Restart to load the new keys:
npm start
```

`seed-vault.js` reads the IBM hardware seed run results and sets each slot's key material to:
```
keyMaterial = SHA-256(satellite_key_hex + seed_hex)
```
80 of 81 slots come from real ibm_marrakesh hardware (avg 7.80 entropy bits). All 81 slots are pre-populated with their Hurwitz quaternion key as the stored payload.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | — | Live dashboard with API explorer |
| `GET`  | `/api/vault/health` | — | Health check |
| `GET`  | `/api/vault/slots`  | — | List slot indices with stored payloads |
| `POST` | `/api/vault/store`  | Key | Store encrypted payload in a slot |
| `POST` | `/api/vault/request` | Key | Request key release; returns `keyMaterial` |
| `GET`  | `/api/vault/audit?limit=N` | Key | Audit log (store/request history) |
| `GET`  | `/api/vault/configs` | Key | List configs |
| `GET`  | `/api/vault/configs/default` | Key | Signature config (crown slot 0, 144 Hurwitz moat) |
| `GET`  | `/api/vault/configs/:id` | Key | Get config by id |
| `POST` | `/api/vault/configs` | Key | Create config |
| `PATCH`| `/api/vault/configs/:id` | Key | Update config |
| `DELETE`| `/api/vault/configs/:id` | Key | Delete config (not default) |

**Auth header:** `X-Vault-Api-Key: <key>`
**Default demo key:** `vault-demo-key-change-in-production`
**Change it:** Set `VAULT_API_KEY` env variable before starting.

---

## Key Material

- **Demo (default):** `SHA-256(VAULT_KEY_SEED + '-' + slotIndex)` — deterministic, changes with `VAULT_KEY_SEED` env
- **Quantum-seeded:** `SHA-256(satellite_key_hex + seed_hex)` — Hurwitz quaternion + IBM hardware entropy (run `seed-vault.js`)
- **Production:** Plug in SHQKD / Echo Resonance key material per slot

---

## Persistence

All vault state (key material, payloads, audit log) is saved to `vault-data.json` after every write. The server loads it automatically on startup — nothing is lost on restart.

`vault-data.json` is gitignored. To reset to a clean state, delete it and restart.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5003` | Server port |
| `VAULT_API_KEY` | `vault-demo-key-change-in-production` | API key for auth |
| `VAULT_KEY_SEED` | `SHQKD-Echo-Resonance-81` | Seed for demo key derivation |

---

## Testing

```bash
# With the server running in another terminal:
npm test
```

Runs 6 smoke tests: health, slots, configs/default, request, store, audit.
