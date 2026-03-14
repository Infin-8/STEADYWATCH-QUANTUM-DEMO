# F4 Node Binding: Geometric Addressing in the SHQKD Trinity

**Authors:** STEADYWATCH™ Research Team
**Date:** March 14, 2026
**Status:** ✅ Implemented — VAULT™ p=5 · VIPER™ p=13 · HORDE™ p=17
**Relates to:** `HURWITZ_DUAL_LATTICE_VISUALIZATION.md`, `HURWITZ_LATTICE_BIOMETRIC_AUTHENTICATION.md`

---

## Abstract

The SHQKD Trinity (VAULT™, VIPER™, HORDE™) operates three independent Hurwitz F4 lattice shells at primes p=5, 13, and 17. Each shell generates 144, 336, and 432 lattice sites respectively. This document describes **F4 Node Binding** — the process by which every operational unit in the system (vault key slots, threat detection keys, swarm defense nodes) is geometrically assigned to a specific F4 lattice site. Once bound, the quaternion coordinates of that site become part of the unit's cryptographic key derivation. The F4 structure is no longer decorative: it is the address book, and without knowing the lattice you cannot reproduce the keys.

---

## 1. Background: Two Different Binding Strategies

The three servers in the Trinity use different architectures that require different binding strategies.

### 1.1 Direct Binding — VIPER™ (p=13) and HORDE™ (p=17)

VIPER and HORDE generate their operational keys **directly from quaternion coordinates**. Each of the 336 (VIPER) or 432 (HORDE) keys is derived by hashing its quaternion:

```javascript
keyHex = SHA-256( q.join(',') )   // e.g. "1,-2,3,-1"
```

The binding is inherent. Each key *is* a quaternion site. The arm (VIPER) or cluster (HORDE) assignment follows from which quadrant of the projected 2D plane the site falls in:

```
Arm/Cluster 0 (+X): x ≥ 0, y ≥ 0  (Q1)
Arm/Cluster 1 (-X): x < 0, y ≥ 0  (Q2)
Arm/Cluster 2 (+Z): x < 0, y < 0  (Q3)
Arm/Cluster 3 (-Z): x ≥ 0, y < 0  (Q4)
```

Every F4 site is an operational unit. There is no moat.

### 1.2 Grid-to-Lattice Binding — VAULT™ (p=5)

VAULT's 81 key slots come from a **9×9 operational grid** — not from quaternion enumeration. Slot indices are integers 0–80, arranged in row-major order. This grid has no intrinsic connection to the F4 lattice at p=5, which generates 144 sites.

The question becomes: **how do you assign 81 integer-indexed grid positions to 144 quaternion lattice sites in a way that is geometrically meaningful?**

This is the problem F4 Node Binding solves for VAULT.

---

## 2. The Binding Algorithm (VAULT)

### 2.1 Coordinate Normalization

Both coordinate systems are normalized to the same [-1, 1] range:

**Grid coordinates** (slot index → 2D position):
```
col = slotIndex % 9
row = floor(slotIndex / 9)
gx  = (col - 4) / 4.0     // range [-1.0, 1.0]
gy  = (row - 4) / 4.0     // range [-1.0, 1.0]
```

The center slot (slot 40, row=4, col=4) maps to (0, 0). Corner slots map to (±1, ±1).

**F4 projected coordinates** (quaternion → 2D):
```
scale = 1.0 / (1 + |d| × 0.1)     // stereographic depth factor
x     = a × scale
y     = c × scale
```

Then normalized by max extent:
```
maxExtent = max( sqrt(x² + y²) )   over all 144 sites
nx = x / maxExtent                  // range [-1, 1]
ny = y / maxExtent                  // range [-1, 1]
```

### 2.2 Nearest-Neighbor Assignment

For each of the 81 slots, the nearest F4 node is found by Euclidean distance in normalized space:

```javascript
dist = sqrt( (gx - nx)² + (gy - ny)² )
```

The F4 node with minimum distance is assigned to that slot. This is a many-to-one mapping: multiple slots can bind to the same F4 node if they are geographically close to it in the projected plane.

### 2.3 Binding Results (p=5)

| Metric | Value |
|--------|-------|
| Vault slots | 81 |
| F4 sites | 144 |
| Unique nodes bound | 49 |
| Moat nodes (unbound) | 95 |
| Multi-bound nodes | 12 |
| Center slot (40) bound to | `(0, -2, 0, 1)` — projects to (0, 0) |
| Corner slot (0) bound to | `(-1.5, 0.5, -1.5, 0.5)` |

The 95 unbound nodes form the **moat** — F4 sites that no grid slot could reach as its nearest neighbor. These are not wasted; they are the structural guard ring of the vault's lattice identity.

---

## 3. Key Derivation with Lattice Address

Once bound, the F4 quaternion coordinates become part of the key derivation input for each slot:

**Before binding:**
```
keyMaterial = SHA-256( seed + "-" + slotIndex )
```

**After binding:**
```
keyMaterial = SHA-256( seed + "-" + slotIndex + "-" + a.toFixed(4) + "," + b.toFixed(4) + "," + c.toFixed(4) + "," + d.toFixed(4) )
```

Example — Slot 0 key derivation:
```
SHA-256( "SHQKD-Echo-Resonance-81" + "-" + "0" + "-" + "-1.5000,0.5000,-1.5000,0.5000" )
→ 592993727424b499...
```

All 81 derived keys are confirmed unique and deterministic.

### 3.1 Cryptographic Property

An attacker who possesses:
- The seed string (`SHQKD-Echo-Resonance-81`)
- The slot index (0–80)

...but does **not** know the p=5 F4 lattice structure cannot reproduce any slot key. They would need to:

1. Know that the key derivation includes quaternion coordinates
2. Know which quaternion coordinate is bound to which slot
3. Know the F4 shell for p=5 — which requires either enumerating Hurwitz quaternion norm-5 solutions or possessing the full binding map

The F4 structure is public (it is the mathematical object), but its role in key derivation is not. The security property is **structural obscurity via lattice geometry**: the binding map is the additional secret factor alongside the seed.

---

## 4. The Moat — Guard Ring of Unbound Sites

The 95 F4 sites not bound to any vault slot are not dead weight. They serve as the **structural moat** of the VAULT identity:

- They are present in the lattice fingerprint hash (`SHA-256` of all 144 sorted sites)
- They appear in the dashboard fingerprint canvas as the outer ring of dim points
- They are part of the Fingerprint View in the 3D game
- They cannot be bound to slots by definition — they are structurally unreachable from the 9×9 grid in the normalized projection

Any attempt to forge the vault's lattice identity must account for all 144 sites, including the 95 moat nodes, to produce a matching fingerprint hash. The moat is a passive structural guarantee — you cannot remove it without breaking the fingerprint.

---

## 5. Comparison: Direct vs. Grid Binding

| Property | VIPER/HORDE (direct) | VAULT (grid binding) |
|----------|----------------------|----------------------|
| Operational units | 336 / 432 | 81 |
| F4 sites | 336 / 432 | 144 |
| Binding type | Identity (unit = quaternion) | Nearest-neighbor projection |
| Moat nodes | None (all sites operational) | 95 unbound sites |
| Key derivation | SHA-256(q.join(',')) | SHA-256(seed + index + q coords) |
| Geometry in key | Implicit (IS the key) | Explicit (embedded in derivation) |

The VAULT binding is the richer case: the mismatch between the operational grid (81 slots) and the F4 shell (144 sites) creates a nontrivial mapping problem that the geometry must solve. The result — 49 unique F4 addresses serving 81 slots, with 95 moat nodes standing guard — has no equivalent in VIPER or HORDE.

---

## 6. API Surface

### VAULT™

**`GET /api/vault/slot-lattice-map`** — Returns the full 81-slot binding table:
```json
{
  "prime": 5,
  "slots": 81,
  "f4Sites": 144,
  "uniqueNodes": 49,
  "binding": [
    {
      "slotIndex": 0,
      "gridRow": 0, "gridCol": 0,
      "latticeNodeIndex": 13,
      "latticeCoords": { "a": -1.5, "b": 0.5, "c": -1.5, "d": 0.5 },
      "projectedX": -1.4286, "projectedY": -1.4286,
      "distance": 0.510706
    },
    ...
  ]
}
```

**`POST /api/vault/request`** — Key release now includes lattice address:
```json
{
  "slotIndex": 0,
  "keyMaterial": "592993727424b499...",
  "latticeAddress": { "a": -1.5, "b": 0.5, "c": -1.5, "d": 0.5 },
  "latticeNodeIndex": 13,
  "gridPos": { "row": 0, "col": 0 }
}
```

---

## 7. Visual Expression

The fingerprint canvas on the VAULT dashboard reflects the geometric binding:

- **Cyan node** — the F4 site bound to slot 0 (crown)
- **Purple node** — an F4 site bound to a slot with a stored payload
- **Dim blue node** — an F4 site bound to one or more empty slots
- **Slightly larger dim node** — an F4 site bound to 2+ slots (shared anchor)
- **Dark node with dashed border** — moat node, unbound

This means the fingerprint canvas is no longer a static decoration: it is a live operational map where geometry and data converge. The same F4 node that determines a slot's key material also determines which pixel on the canvas lights up when that slot is used.

---

## 8. Extension to VIPER and HORDE

VIPER and HORDE do not require grid-to-lattice binding because their key matrices ARE the lattices. The future extension of this work for those servers is:

- **VIPER**: surface the quaternion address in the `/api/viper/scan` response alongside the existing `nodeIndex` — already partially done via `quaternion` field
- **HORDE**: same for `/api/horde/respond`
- **Cross-server**: the LatticeLink session seed (XOR of two server fingerprint hashes) represents the first inter-server geometric relationship — a session whose identity is derived from the intersection of two F4 shells

The long-term vision is a **Trinity address space** where any key, slot, or response in the system carries a quaternion coordinate as its canonical geometric address — locating it not just in operational space (slot 0–80, key 0–335, node 0–431) but in the F4 lattice of its prime.

---

## 9. Summary

| Concept | Description |
|---------|-------------|
| F4 Node Binding | Assigning each operational unit to its nearest F4 lattice site |
| Geometric address | The quaternion `(a, b, c, d)` of the bound F4 node |
| Load-bearing lattice | F4 coordinates embedded in key derivation — not just visualization |
| Moat | The 95 F4 sites (at p=5) unreachable from the 9×9 grid; structural guard ring |
| Normalization | Grid [-1,1] and F4 projected [-1,1] aligned before nearest-neighbor search |
| Key formula | `SHA-256(seed + "-" + index + "-" + a,b,c,d)` |
| Security property | Without the F4 binding map, slot keys cannot be reproduced |
| Visual expression | Dashboard fingerprint canvas lit by live slot occupancy via geometric binding |

---

*Document prepared March 14, 2026 · SteadyWatch / Quantum V^ LLC · Provisional patent filed December 1, 2025*
*Implementation: `vault-api/server.js` · Middleware: `lattice-auth-middleware.js`*
