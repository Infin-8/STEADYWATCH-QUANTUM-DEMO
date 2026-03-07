# Layers-336 Three.js Visual and Gamow Quantum Tunneling

**Status:** Research note — structural similarity confirmed  
**Visual:** `layers-336-three.js` (336 Hurwitz Key full Three.js layers view)  
**Reference:** George Gamow, quantum tunneling / alpha decay (1928)

---

## Summary

The **layers-336-three.js** visualization is structurally remarkably similar to the classic **George Gamow "quantum tunneling"** picture used for alpha decay: a single source (left), a filled transition/barrier region (middle), and an emerged wave pattern (right).

---

## Gamow Quantum Tunneling (Brief)

- **Gamow (1928)** explained alpha decay by quantum tunneling through a Coulomb potential barrier.
- **Classical picture:** Alpha particle trapped inside nucleus; barrier (e.g. ~26 MeV) higher than particle energy (~4–9 MeV) → classically cannot escape.
- **Quantum picture:** Wavefunction has finite probability of penetrating the barrier (exponential decay inside the barrier) and emerging on the far side with reduced amplitude; repeated “attempts” explain observed half-lives (Geiger–Nuttall law).
- **Standard diagram:**  
  **[Nuclear well]** → **[Barrier (classically forbidden)]** → **[Escaped wave (small amplitude)]**  
  Left = trapped state, middle = barrier/transition, right = emerged wave.

**References:**

- HyperPhysics: [Alpha Particle Tunneling](https://hyperphysics.phy-astr.gsu.edu/hbase/Nuclear/alptun.html), [Potential Barriers and Tunneling](https://hyperphysics.phy-astr.gsu.edu/hbase/quantum/barr.html)
- EBSCO / textbooks: Gamow explains radioactive alpha decay with quantum tunneling
- Tunneling probability ∝ e^(-2κd); wavefunction continuous across barrier

---

## Layers-336 Visual Layout

From `layers-336-three.js`:

| Region   | Position (X)   | Content |
|----------|-----------------|--------|
| **Left** | `-slitDistance` | Single **seed** sphere (golden, emissive) — one Hurwitz “source” |
| **Middle** | `-slitDistance` → `+slitDistance` | **336 key spheres** in a cylinder: golden-angle spiral in Y/Z, Perlin noise, Tesla 3/6/9 harmonics, animated glow (UnifiedQubitStyling) |
| **Right** | `+slitDistance` | **336 spheres** in a **wave-like pattern** (echo wave in Y, phase from quaternion components), animated |

So the flow is: **one seed (left) → many keys filling the middle volume → wave pattern (right)**.

---

## Structural Correspondence

| Gamow tunneling diagram | Layers-336 visual |
|-------------------------|--------------------|
| Nucleus / trapped alpha (single source) | Left: single seed sphere |
| Barrier / classically forbidden region (wavefunction spreads/decays) | Middle: 336 spheres filling the “slit” volume — many realizations / probability spread |
| Escaped wave (small amplitude, oscillating) | Right: 336 spheres in wave pattern (echo wave, phase from quaternions) |

- **Left:** One compact source (seed / nucleus).
- **Middle:** Transition region filled with many points — analogous to the barrier region where probability amplitude is distributed (or many “attempts” through the barrier).
- **Right:** Emerged “wave” — discrete points arranged in a wave (Y/Z) with time-dependent echo wave; evokes the post-tunneling wave with reduced amplitude and definite energy.

The similarity is **structural and visual**, not a literal Schrödinger simulation: the three-panel layout (source → filled middle → wave) mirrors the standard Gamow-style tunneling sketch.

---

## Conclusion

The layers-336 Three.js visual is **remarkably similar** to the George Gamow quantum tunneling (alpha decay) picture in terms of:

1. **Three spatial regions:** source (left), transition/barrier region (middle), emerged wave (right).  
2. **One-to-many:** single seed → 336 keys in the middle.  
3. **Wave on the far side:** right plane shows a wave-like pattern (echo + phase), reminiscent of the escaped wavefunction.

This can be cited as a **conceptual and visual parallel** between the Hurwitz 336-key “expansion” (one prime seed → 336 quaternion keys → wave manifestation) and the classic quantum tunneling narrative (trapped state → barrier penetration → emerged wave).

---

## Do We Have the Pieces for a Literal Schrödinger Simulation?

**Short answer:** Yes. A 1D Gamow-style solver and export pipeline are implemented (see [Implementation](#implementation-literal-schrödinger-solver) below). The following table summarized the original status; the solver now provides the missing pieces.

### What Exists in the Repo

| Piece | Status | Where |
|-------|--------|--------|
| **Schrödinger time evolution (form)** | Documented only | `QUANTUM_STATE_TRANSITION_MODELS.md` (time-dependent equation and evolution operator); `MATHEMATICAL_VERIFICATION.md` |
| **Swift pseudocode for evolution** | Doc only | `QUANTUM_STATE_TRANSITION_MODELS.md` — `QuantumStateEvolution` with Hamiltonian matrix and exp(-iHt/ℏ); not wired into the app |
| **NumPy** | ✅ Available | `quantum_computing/requirements.txt` |
| **Scipy** | ✅ In requirements | `quantum_computing/requirements.txt` (scipy>=1.10.0); used by `schrodinger_tunneling.py` (sparse H, Crank-Nicolson solve) |
| **Three-panel layout** | ✅ Implemented | `layers-336-three.js` — left/middle/right; could be driven by computed probability density or transmission |
| **Qiskit / gate-based simulation** | ✅ Extensive | Qubit circuits, not continuous 1D wave mechanics |

### What's Missing for a Literal 1D Gamow-Style Simulation

1. ~~**Spatial discretization**~~ — ✅ Implemented in `schrodinger_tunneling.py`.
2. ~~**Potential V(x)**~~ — ✅ Rectangular barrier (and optional well) in same module.
3. ~~**Hamiltonian**~~ — ✅ Finite-difference H (sparse).
4. ~~**Time evolution**~~ — ✅ Crank-Nicolson (exp(-i H Δt/ℏ) step).
5. ~~**Initial condition**~~ — ✅ Gaussian packet with momentum.
6. ~~**Output → visual**~~ — ✅ JSON export; optional: wire layers-336 to load it.

### What Would Be Needed (Minimal Path)

- **Python (e.g. in `quantum_computing/`):** Add `scipy` to `requirements.txt` (for `scipy.sparse`, `scipy.linalg.expm`). One small module: 1D grid, V(x) barrier, finite-difference H, time step with exp(-i H Δt/ℏ) (or steady-state solve), compute probability density and optionally transmission coefficient.
- **Optional:** Export time slices or steady-state to JSON so `layers-336-three.js` (or a variant) can map them to the three panels (e.g. middle = barrier region density, right = transmitted wave).

So: **we have the math in docs, NumPy, and the visual layout; we do not yet have the actual Schrödinger solver (grid, V(x), H, time evolution or eigenstates) or the pipeline from solver output to the layers-336 visual.**

---

## Implementation (Literal Schrödinger Solver)

**Status: Implemented.** A 1D Gamow-style Schrödinger tunneling solver and export pipeline are in place.

| Component | Location | Description |
|-----------|----------|-------------|
| **Solver** | `quantum_computing/schrodinger_tunneling.py` | 1D grid, rectangular barrier V(x), finite-difference H, Crank-Nicolson time evolution, Gaussian packet initial condition, transmission coefficient |
| **Export** | Same module | `export_for_layers_336()` writes JSON to `STEADYWATCH-QUANTUM-DEMO/data/schrodinger_tunneling_export.json` (or path of choice) |
| **Data** | `STEADYWATCH-QUANTUM-DEMO/data/` | `README.md` describes format; pre-generated export can be used by a future “Schrödinger mode” in the layers visual |

### How to run

From repo root:

```bash
cd quantum_computing
pip install -r requirements.txt   # includes scipy>=1.10.0
python3 schrodinger_tunneling.py
```

Optional: pass an output path as the first argument.

### Using the export in the layers-336 visual

The JSON contains `x`, `potential`, `probability_density` (list of |ψ|² snapshots), and `times`. On the layers-336 page, click **Schrödinger mode** to load this JSON and map:

- **Left panel:** density in the “well” region (x &lt; barrier).
- **Middle panel:** density in the barrier region.
- **Right panel:** density in the transmitted region (x &gt; barrier).

Drive sphere opacity/scale or position from the density at the corresponding x bins to show literal Gamow tunneling alongside the existing Hurwitz 336-key view.

---

**Summary:** The literal Schrödinger solver is implemented; the pipeline from solver → JSON export is in place; **Schrödinger mode** is wired as a user-event button on the layers-336 page and drives the three panels from the export.

---

*Document created March 2026; references Gamow (1928), HyperPhysics alpha tunneling, and STEADYWATCH-QUANTUM-DEMO `layers-336-three.js`.*
