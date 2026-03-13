# HORDE™ — Quantum-Backed Swarm Defense

HORDE™ is a quantum-backed swarm defense system built on Hurwitz quaternion mathematics. It evaluates any threat input against 432 defense nodes arranged in 4 clusters, using collective neighborhood consensus to determine the appropriate defensive posture. No single node makes the call — the swarm decides.

This is the defense layer of the STEADYWATCH security platform.

---

## The Problem It Solves

Modern security response is either manual (SOC analysts interpreting alerts and deciding actions) or rule-based (if threat X, then action Y). Both approaches break down at scale: manual response cannot keep pace with automated attacks, and rule-based response cannot adapt to threats that don't match predefined patterns.

HORDE™ is different. Its 432 defense nodes derive from the Hurwitz quaternion lattice at prime p=17 — the densest 4D packing configuration in the Security Trinity. When a threat input arrives, the top 25% of closest nodes form a voting neighborhood. Each node votes for its cluster. The cluster with the most votes wins and its defense posture becomes the collective recommendation. The response is not a rule — it is a geometric consensus. It adapts to the input's position in 4D space, not to a predefined pattern library.

---

## How It Works

### The Mathematical Foundation

HORDE™ uses the p=17 Hurwitz quaternion satellite configuration: 432 quaternion integers with identical prime norm, distributed across 4 defense clusters of 108 nodes each. The clusters align with 4 strategic defense doctrines — not by convention, but by the geometric directionality of the Hurwitz lattice in 4D space.

Defense posture for any input follows a transparent consensus pipeline:

```
input → SHA-256(input) → Hamming distance × 432 node hashes → top 25% neighborhood → cluster vote → posture + consensus score
```

Where consensus score = `winning cluster votes / neighborhood size`. A score of 0.25 means uniform distribution — no dominant posture. A score above 0.40 means the swarm agrees. This conservative-by-design threshold means HORDE™ only escalates when the collective signal is clear — minimizing false alarms at scale.

### The 4 Defense Clusters

| Cluster | Direction | Posture | Recommends |
|---------|-----------|---------|------------|
| 0 | +X | **SWARM** | Deploy mass response — activate all available defense assets, overwhelming coordinated force |
| 1 | -X | **SHIELD** | Form protective perimeter — isolate critical assets, defensive clustering around high-value targets |
| 2 | +Z | **TRACE** | Persistent covert tracking — do not alert the attacker, maintain surveillance, map the full threat |
| 3 | -Z | **ADAPT** | Update and harden — rotate signatures, patch the attack surface, change the geometry the attacker is mapping |

The TRACE posture deserves specific attention: it is the only defense doctrine that deliberately withholds response. When the swarm consensus points to TRACE, HORDE™ is recommending that intelligence value exceeds the cost of continued exposure. This is a nuanced recommendation that rule-based systems cannot produce — it requires understanding the threat's position in the kill chain, not just its presence.

### Consensus vs. Closest Node

VIPER™ uses the closest single node — precision targeting, like a scalpel. HORDE™ uses neighborhood consensus — collective judgment, like a swarm. This distinction is intentional and meaningful:

- **VIPER™:** "This input is closest to node 156. Node 156 is in the LATERAL arm. Kill chain phase: Lateral Movement."
- **HORDE™:** "108 nodes respond. SHIELD wins with 34 votes (31.5% consensus). Recommended posture: Form protective perimeter."

HORDE™ is not trying to classify the threat — VIPER™ already did that. HORDE™ is deciding what to do about it. The neighborhood vote provides a confidence-weighted recommendation that accounts for the full distribution of the threat across 4D space, not just its single closest point.

### The 3D Interface

The crystal board (`game-432.js`) is not a demo — it is the interface. Each of the 432 blocks on the board is a defense node. Unlike VIPER™'s linear arm layout, HORDE™'s board reflects the swarm structure: nodes pack in clustered formations, with the dominant cluster emerging from collective density. Mining activity on the board mirrors swarm consensus — the whole board is active, and the pattern that emerges shows you which defense doctrine the geometry is pointing toward.

---

## The Security Trinity

HORDE™ is the defense layer in a three-product security stack built on the same Hurwitz quaternion mathematical foundation:

```
THE VAULT™  (p=5  — 144 keys — 81 slots)   →  Root of trust. Key storage and provisioning.
VIPER™      (p=13 — 336 keys — 4 arms)     →  Threat detection. Kill chain classification.
HORDE™      (p=17 — 432 keys — 4 clusters) →  Swarm defense. Collective posture response.
```

VIPER™ detects. HORDE™ responds. THE VAULT™ is what they're protecting.

The operational pipeline is direct: feed the same input to both VIPER™ and HORDE™. VIPER™ returns the kill chain phase. HORDE™ returns the defense posture. Together they give you threat intelligence and action directive in a single round-trip — both derived from the same mathematical foundation, both requiring no training data, both deterministic and auditable.

---

## Product Tiers

### Colony
- **Coverage:** 1 cluster (108 nodes) — Cluster 0 (SWARM posture) only
- **Use case:** Lightweight first-response for high-volume environments where speed matters more than posture precision
- **Call:** `"tier": "colony"` — 27-node neighborhood, fast response
- **Best for:** Automated incident response pipelines that need a rapid initial action directive

### Swarm
- **Coverage:** 4 clusters (432 nodes) — full consensus defense
- **Use case:** Standard deployment — complete posture coverage across all 4 defense doctrines
- **Call:** `"tier": "swarm"` (default) — 108-node neighborhood
- **Best for:** Security teams that need nuanced, posture-aware defense recommendations including TRACE (covert surveillance)

### Legion *(Enterprise)*
- **Coverage:** Custom cluster selection, adjustable sensitivity per cluster
- **Features:** Webhook alerts on posture threshold breach, streaming response API, multi-tenant API keys, custom defense configurations
- **Integration:** THE VAULT™ key injection (quantum-seeded node signatures), VIPER™ automatic trigger (BREACH or LATERAL above threshold → HORDE™ response), unified threat-to-posture dashboard
- **Best for:** Enterprise SOC teams, MSSPs, and platform integrators building HORDE™ into a full Security Trinity deployment

---

## Licensing

HORDE™ is licensed per deployment. A license covers:

- One HORDE™ instance (432 nodes, full 4-cluster swarm consensus)
- REST API with configurable sensitivity and tier selection
- Response history with filtering and cluster breakdown
- Dashboard and live cluster activity monitoring

**Security Trinity licensing** bundles THE VAULT™ + VIPER™ + HORDE™ under a single license — one mathematical foundation covering key storage, threat detection, and defense response.

Contact: [steadywatchapp@gmail.com](mailto:steadywatchapp@gmail.com)

---

## What Makes It Different

| | Rule-Based SOAR | ML-Based Response | HORDE™ |
|---|---|---|---|
| Response basis | Predefined rules | Learned response policies | Hurwitz quaternion geometry (4D, mathematically structured) |
| Novel threat coverage | Blind — no matching rule | Partial — requires similar training samples | Full — any input maps to a defense cluster |
| Nuanced postures | Only what rules encode | Only what training encoded | Native — TRACE (covert), ADAPT (harden), SHIELD (protect), SWARM (overwhelm) |
| False positive rate | High (rules misfire) | Medium (model uncertainty) | Conservative by design — consensus threshold prevents escalation on noise |
| Training required | Yes (rule authoring) | Yes (continuous retraining) | No — defense matrix is deterministic at startup |
| VIPER™ integration | Requires custom integration | Requires custom integration | Native — same mathematical pipeline, direct input handoff |
| Quantum resistance | None | None | 4D geometric consensus — no statistical assumptions |

---

## More Information

- **API reference:** [README.md](README.md)
- **User guide:** [HORDE_USER_GUIDE.md](HORDE_USER_GUIDE.md)
- **THE VAULT™ (root of trust):** [../vault-api/THE_VAULT.md](../vault-api/THE_VAULT.md)
- **VIPER™ (threat detection):** [../viper-api/THE_VIPER.md](../viper-api/THE_VIPER.md)
- **Research background:** [RESEARCH_DISCOVERIES.md](../../RESEARCH_DISCOVERIES.md) — Discovery 42
