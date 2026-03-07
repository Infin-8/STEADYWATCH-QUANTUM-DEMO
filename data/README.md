# Schrödinger Tunneling Export Data

This folder holds JSON exports from the 1D Gamow-style Schrödinger tunneling solver.

## Generating the export

From the SteadyWatch repo root (or `quantum_computing/`):

```bash
cd quantum_computing
python3 schrodinger_tunneling.py
```

Or with a custom output path:

```bash
python3 schrodinger_tunneling.py path/to/export.json
```

Default output: `STEADYWATCH-QUANTUM-DEMO/data/schrodinger_tunneling_export.json`

## JSON format

- **`x`**: 1D grid positions (length ≤ 500 for demo).
- **`potential`**: V(x) at each grid point.
- **`probability_density`**: Array of arrays; each inner array is |ψ(x)|² at one time step.
- **`times`**: Time value for each probability_density snapshot.
- **`metadata.params`**: Run parameters (barrier height/position, packet, transmission, etc.).

The three-panel layers-336 visual can map: **left** = source (x &lt; barrier), **middle** = barrier region, **right** = transmitted (x &gt; barrier). Use `probability_density` to drive sphere intensity or position along the pipeline.
