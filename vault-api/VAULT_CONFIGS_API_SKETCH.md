# THE VAULT™ — Configs API sketch

Sketch for **custom key configurations** (moat, symbol, layout) as tiered packages. Includes the preferred config: **key at slot 0, 144 Hurwitz moat, then unlocked key moat**.

---

## Preferred config (canonical tier)

**Name:** Key-at-zero, 144 Hurwitz moat, unlocked key moat.

- **Crown key:** Slot index `0` (single primary key; 9×9 board mapping: row = 4 − bz, col = bx + 4, index = row×9 + col → slot 0 = one corner).
- **First moat:** 144-point Hurwitz cluster (Hurwitz quaternion satellites) — guard/perimeter layer.
- **Second moat:** Unlocked key moat — orbital key-drop cluster (the expanding/orbiting key drops after unlock).

This is the “signature” layout: one key at index 0, 144 Hurwitz as inner moat, then the unlocked key moat. Suited as the default or premium tier.

---

## Config resource (schema sketch)

```json
{
  "id": "config-uuid-or-slug",
  "name": "Key-at-zero, 144 Hurwitz moat, unlocked key moat",
  "tier": "signature",
  "crownSlotIndex": 0,
  "moatLayers": [
    {
      "kind": "hurwitz",
      "points": 144,
      "role": "guard"
    },
    {
      "kind": "unlocked_key_moat",
      "role": "orbital"
    }
  ],
  "slotRoles": { "0": "crown" },
  "meta": { "createdAt": "ISO8601", "updatedAt": "ISO8601" }
}
```

- **crownSlotIndex:** Single primary key slot (e.g. `0`).
- **moatLayers:** Ordered list: first = 144 Hurwitz, second = unlocked key moat. Optional extra layers (e.g. symbol, custom).
- **slotRoles:** Optional map slotIndex → role (e.g. `"crown"`, `"guard"`, `"symbol"`, `"reserved"`).
- **tier:** Product tier name (e.g. `signature`, `standard`, `enterprise`).

---

## Endpoints (sketch)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/vault/configs` | Key | List configs for the API key (or tenant). |
| `GET`  | `/api/vault/configs/:id` | Key | Get one config by id or slug. |
| `POST` | `/api/vault/configs` | Key | Create a config (body: name, tier, crownSlotIndex, moatLayers, slotRoles). |
| `PATCH`| `/api/vault/configs/:id` | Key | Update config (partial). |
| `DELETE`| `/api/vault/configs/:id` | Key | Delete a config. |
| `GET`  | `/api/vault/configs/default` | Key | Get default config (e.g. preferred “key at 0, 144 Hurwitz moat, unlocked key moat”). |

**Optional:** `POST /api/vault/request` and `POST /api/vault/store` accept `configId` (or `config`) so release/store are scoped to a config’s slot roles / moat rules.

---

## Request/Store scoped to config (optional)

- **Request:** `POST /api/vault/request`  
  Body: `{ "slotIndex": 0, "configId": "signature" }`  
  Backend checks that slot 0 is allowed for that config (e.g. crown); optionally enforce “only crown” or “only guard slots” per config.

- **Store:** Same idea: `configId` in body; backend may restrict which slots are writable per config (e.g. crown only, or guard ring only).

---

## Default config (seed data)

On first run or via seed, create the preferred config:

- **id:** `signature` (or `default`)
- **name:** `Key-at-zero, 144 Hurwitz moat, unlocked key moat`
- **tier:** `signature`
- **crownSlotIndex:** `0`
- **moatLayers:** `[{ "kind": "hurwitz", "points": 144, "role": "guard" }, { "kind": "unlocked_key_moat", "role": "orbital" }]`
- **slotRoles:** `{ "0": "crown" }`

3D UI can use this config to drive: which block is the crown (slot 0), render 144 Hurwitz as first moat, then unlocked key cluster as second moat.

---

## One-pager: Signature tier

**THE VAULT — Signature tier**

- **Crown:** One key at slot index **0**.
- **First moat:** **144 Hurwitz** — 144-point Hurwitz quaternion satellite layer (guard).
- **Second moat:** **Unlocked key moat** — orbital key-drop cluster after unlock.

Use case: Default or premium tier; clear visual hierarchy (key at 0, 144 guard, then unlocked keys). API: use `configId: "signature"` or `GET /api/vault/configs/default` to get this config; request/store can scope to it for tiered behavior.

---

## Configurator UI (sketch)

**Goal:** Let users design custom key configurations in the 3D vault and save them as named configs (tiered packages).

- **Design mode:** Toggle in THE VAULT page (e.g. “Design config” or “Configurator”). In design mode:
  - **Crown:** User picks one block (slot) as the crown key → `crownSlotIndex`.
  - **Moat layers:** User adds layers in order: e.g. “144 Hurwitz” (guard), then “Unlocked key moat” (orbital). Optional: “Symbol” layer with slot→symbol mapping.
  - **Slot roles:** Optional per-slot labels (crown, guard, symbol, reserved) for display and for optional store/request scoping.
- **Save:** Call `POST /api/vault/configs` with the current design (name, tier, crownSlotIndex, moatLayers, slotRoles). Show success and list configs.
- **Load:** Dropdown or list of configs (`GET /api/vault/configs`); on select, `GET /api/vault/configs/:id` and apply to 3D view: highlight crown block, render moat layers (144 Hurwitz ring, then unlocked key cluster), apply slot roles for tooltips/labels.
- **Default:** “Load default” loads `GET /api/vault/configs/default` (signature: key at 0, 144 Hurwitz moat, unlocked key moat) and applies it to the scene.

Implementation note: game.js already has 81-block board, key drops (144/336 cluster), and slot index from `worldToSlotIndex(bx, bz)`. Configurator adds: (1) a mode flag and UI for “select crown” / “add moat layer” / “set slot role”; (2) fetch configs from API and apply `crownSlotIndex` + `moatLayers` to drive which block is crown and how key drops are grouped (e.g. one cluster at crown, 144 Hurwitz as first ring, orbital as second).
