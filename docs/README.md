# STEADYWATCH-QUANTUM-DEMO — Documentation Index

This is the main documentation entry point for the STEADYWATCH™ Quantum Demo site: SHQKD protocol, THE VAULT™, Keyz game, research papers, and operations.

---

## Overview

The demo showcases **STEADYWATCH Hybrid Quantum Key Distribution (SHQKD)** and related research: GHZ entanglement validated on IBM Quantum and AWS Braket, Echo Resonance encryption, Hurwitz Keyz, and **THE VAULT™** — a quantum-backed 81-slot key store with a 3D Keyz board as the interface.

---

## Documentation by topic

### THE VAULT™

| Document | Description |
|----------|-------------|
| [THE VAULT™ — Product & architecture](THE_VAULT.md) | What THE VAULT is, architecture, UI flow, API usage, and links to API and ops. |
| [vault-api/README.md](../vault-api/README.md) | Run the vault API, endpoints, auth, key material (demo vs production). |
| [VAULT_OPS.md](VAULT_OPS.md) | Key custody, rotation, backup/recovery, regulatory compliance, production checklist. |

### Keyz game (81-block board)

| Document | Description |
|----------|-------------|
| [KEYZ_GAME_81_BLOCKS.md](KEYZ_GAME_81_BLOCKS.md) | 81-block Keyz implementation: board, blocks, key drops, buildWorld, interaction, animate loop, dependencies. |

### Demo site

| Document | Description |
|----------|-------------|
| [SITE_GUIDE.md](SITE_GUIDE.md) | All pages (Home, Jobs, VS, 144-satellites, layers-336, Echo, Consulting, THE VAULT, Contact), how to run locally, repo structure. |

### Research papers

Papers live in **docs/research/** and are linked from the site’s Research section. Key entries:

| Paper | Description |
|-------|-------------|
| [QKD_MILESTONE_RESEARCH_PAPER.md](research/QKD_MILESTONE_RESEARCH_PAPER.md) | First end-to-end QKD validation on real hardware (white paper). |
| [QKD_ACADEMIC_PAPER.md](research/QKD_ACADEMIC_PAPER.md) | Formal security analysis, academic submission. |
| [RESEARCH_PAPER_QKD_HARDWARE_VALIDATION.md](research/RESEARCH_PAPER_QKD_HARDWARE_VALIDATION.md) | SHQKD complete protocol validation, IBM & AWS Braket. |
| [CROSS_PLATFORM_QUBIT_AGGREGATION.md](research/CROSS_PLATFORM_QUBIT_AGGREGATION.md) | Cross-platform qubit aggregation (783 qubits). |
| [GHZ_NETWORK_AUTHENTICATION_GUIDE.md](research/GHZ_NETWORK_AUTHENTICATION_GUIDE.md) | GHZ-based network authentication. |
| [144_SATELLITES_SEED_GENERATION.md](research/144_SATELLITES_SEED_GENERATION.md) | 144 Z primes, Hurwitz Quaternion satellite architecture. |
| [HURWITZ_DUALITY_EXPRESSION_MATHEMATICAL_VALIDATION.md](research/HURWITZ_DUALITY_EXPRESSION_MATHEMATICAL_VALIDATION.md) | Hurwitz duality expansion/compression validation. |
| [UNIFIED_FRAMEWORK_RESEARCH_PAPER.md](research/UNIFIED_FRAMEWORK_RESEARCH_PAPER.md) | Unified information-theoretic framework (QKD + data structures). |
| [BELL_INEQUALITY_BREAKTHROUGH.md](research/BELL_INEQUALITY_BREAKTHROUGH.md) | Bell inequality violation with quantum randomness. |
| [RESEARCH_PAPER_ENTROPY_HASH_MAPS.md](research/RESEARCH_PAPER_ENTROPY_HASH_MAPS.md) | Entropy-based hash map optimization. |

Additional research (entropy queues, Mermin, freedom-of-choice, etc.) is in the same folder.

---

## Quick start

- **Browse the site:** Open `index.html` (or deploy the repo) and use the nav: Home, Jobs, VS, (P == |\>), 13 => 336, Echo, Consulting, **THE VAULT™**, Contact.
- **Run THE VAULT API:** `cd vault-api && npm install && npm start` (default port 5003). Then open the THE VAULT page, enable “Vault API,” set base URL (e.g. `http://localhost:5003`) and API key (`vault-demo-key-change-in-production`), and click blocks to request key release.
- **Repo:** [GitHub — STEADYWATCH-QUANTUM-DEMO](https://github.com/Infin-8/STEADYWATCH-QUANTUM-DEMO)

---

## Glossary

- **SHQKD** — STEADYWATCH Hybrid Quantum Key Distribution: GHZ entanglement + Echo Resonance, validated on NISQ hardware.
- **THE VAULT™** — 81-slot quantum-backed key store; 3D Keyz board = 81 key slots; “mining” a block = request key release (with auth and audit).
- **Keyz / Hurwitz Keyz** — 144 (p=5) or 336 (p=13) Hurwitz quaternion–derived keys; used in the Keyz game and in the vault metaphor.
- **Echo Resonance** — Computational layer: 2^4096 key space, master–satellite structure, patent-protected.
- **GHZ** — Entanglement-based layer; information-theoretic security; validated on IBM Quantum (e.g. 12-qubit, 69% fidelity).
