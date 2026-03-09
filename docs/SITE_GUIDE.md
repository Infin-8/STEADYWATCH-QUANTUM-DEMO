# STEADYWATCH-QUANTUM-DEMO — Site Guide

This guide describes every page on the demo site, how to run it locally, and the main repo structure.

---

## Pages

| Page | File | Description |
|------|------|-------------|
| **Home** | [index.html](../index.html) | SHQKD overview, key features, stats (fidelity, endpoints, qubits), use cases, quantum hardware partners (IBM, AWS, Azure), interactive 12-qubit GHZ visualization, research paper links, FAQ, repository links. |
| **Jobs** | [hardware-validation.html](../hardware-validation.html) | Quantum job validation: IBM Quantum and AWS Braket job IDs and status. |
| **VS** | [comparison.html](../comparison.html) | Comparison content (e.g. SHQKD vs alternatives). |
| **(P == \|>)** | [144-satellites.html](../144-satellites.html) | 144 Hurwitz Quaternion satellites / Z primes — interactive visual. |
| **13 => 336** | [layers-336.html](../layers-336.html) | Layers-336 visualization (Hurwitz 336 keys). |
| **Echo** | [echo-visual.html](../echo-visual.html) | Echo Resonance visualization. |
| **Consulting** | [consulting-services.html](../consulting-services.html) | Consulting services. |
| **THE VAULT™** | [game.html](../game.html) | 81-block Keyz board; optional Vault API panel to request key release per slot. See [THE_VAULT.md](THE_VAULT.md). |
| **Contact** | [contact.html](../contact.html) | Contact. |

---

## Running locally

1. **Static site:** Serve the repo root with any HTTP server (e.g. `npx serve .`, or open `index.html` in a browser). All pages are static HTML/CSS/JS.
2. **THE VAULT API (optional):** To use the vault key-release flow, run the API in a separate terminal:
   ```bash
   cd vault-api
   npm install
   npm start
   ```
   Then on the THE VAULT page, enable “Vault API,” set base URL to `http://localhost:5003` and API key to `vault-demo-key-change-in-production`.
3. **CORS:** The vault API enables CORS so the demo origin can call it; for production, restrict origins.

---

## Repo structure (main entries)

```
STEADYWATCH-QUANTUM-DEMO/
├── index.html              # Home
├── game.html               # THE VAULT (Keyz 81-block)
├── game.js                 # Keyz + vault request logic
├── 144-satellites.html
├── 144-satellites-visualization.js
├── layers-336.html
├── layers-336-three.js
├── echo-visual.html
├── echo-visualization.js
├── hardware-validation.html
├── comparison.html
├── consulting-services.html
├── contact.html
├── ghz-visualization.js    # 12-qubit GHZ viz on Home
├── styles.css
├── app.js
├── header-hurwitz-bg.js
├── js/
│   ├── hurwitz-keys.js
│   └── unified-qubit-styling.js
├── vault-api/              # THE VAULT backend
│   ├── server.js
│   ├── package.json
│   └── README.md
├── docs/
│   ├── README.md           # This documentation index
│   ├── THE_VAULT.md
│   ├── SITE_GUIDE.md       # This file
│   ├── KEYZ_GAME_81_BLOCKS.md
│   ├── VAULT_OPS.md
│   └── research/          # Research papers
└── data/
```

---

## Dependencies (front end)

- **Three.js** r128 + OrbitControls (CDN) — used by game, 144-satellites, layers-336, echo, GHZ viz.
- **HurwitzKeys** (js/hurwitz-keys.js) — Keyz quaternion data.
- **UnifiedQubitStyling** (js/unified-qubit-styling.js) — Styling for Keyz blocks and orbs.

No build step is required for the static site; the vault API is Node.js (see vault-api/README.md).
