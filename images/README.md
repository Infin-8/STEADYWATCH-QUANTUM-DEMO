# Images Directory

This directory contains visual assets for the SteadyWatch Quantum Demo repository.

## 📸 Required Images

To complete the README visuals, add the following images to this directory:

### **Circuit Diagrams**

1. **`ghz-circuit-12qubit-linear.png`**
   - **Description:** Linear 12-qubit GHZ circuit diagram
   - **Shows:** H gate initialization + CX chain entanglement
   - **Usage:** Main README, 12-Qubit GHZ Circuit section
   - **How to create:**
     - Use Qiskit to generate circuit diagram: `circuit.draw('mpl')`
     - Or use quantum circuit visualization tools
     - Export as PNG (recommended: 1200x600px)

2. **`ghz-experimental-3-6qubit.png`**
   - **Description:** Experimental 3-6 qubit GHZ setup
   - **Shows:** Smaller GHZ circuit (extendable to 12 qubits)
   - **Usage:** Technical Details section
   - **How to create:** Similar to above, but for 3-6 qubits

### **Conceptual Diagrams**

3. **`ghz-entanglement-multipartite.png`**
   - **Description:** Multi-qubit GHZ entanglement visualization
   - **Shows:** Conceptual illustration of entangled qubits
   - **Usage:** GHZ Entanglement Visualization section
   - **How to create:**
     - Use quantum visualization tools
     - Or create a conceptual diagram showing qubit connections
     - Style: Clean, scientific illustration

4. **`multipartite-ghz-entanglement.png`**
   - **Description:** Multipartite GHZ entanglement illustration
   - **Shows:** Multiple qubits in entangled state
   - **Usage:** Technical Details section
   - **How to create:** Similar to above

5. **`long-range-ghz-preparation.png`**
   - **Description:** Long-range GHZ preparation for networks
   - **Shows:** Multi-hop network with GHZ states
   - **Usage:** Technical Details section
   - **How to create:**
     - Network diagram showing nodes and GHZ connections
     - Can use network visualization tools

### **Data Visualization**

6. **`ghz-fidelity-chart.png`**
   - **Description:** Bar chart of GHZ state measurement results
   - **Shows:** All-zeros (39%), All-ones (30%), Errors (31%)
   - **Usage:** Fidelity Visualization section
   - **How to create:** See `ghz-fidelity-chart.md` for Python code

---

## 🎨 Image Creation Guide

### **Option 1: Generate from Qiskit**

```python
from qiskit import QuantumCircuit
import matplotlib.pyplot as plt

# Create 12-qubit GHZ circuit
qc = QuantumCircuit(12)
qc.h(0)
for i in range(11):
    qc.cx(i, i+1)

# Draw and save
qc.draw('mpl', filename='ghz-circuit-12qubit-linear.png')
```

### **Option 2: Use Online Tools**

- **Qiskit Textbook:** https://qiskit.org/textbook
- **Quirk:** https://algassert.com/quirk (circuit simulator)
- **Quantum Circuit Simulator:** Various online tools

### **Option 3: Create Conceptual Diagrams**

- **Draw.io / Diagrams.net:** Network and conceptual diagrams
- **Inkscape / Illustrator:** Professional illustrations
- **Python (matplotlib):** Programmatic diagrams

---

## 📋 Image Requirements

- **Format:** PNG (preferred) or SVG
- **Resolution:** Minimum 1200px width for circuit diagrams
- **Style:** Clean, professional, scientific
- **Colors:** Use color to highlight important elements
- **Text:** Include labels and annotations where helpful

---

## 🚀 Quick Start

1. **Create or find images** matching the descriptions above
2. **Save them** in this `images/` directory
3. **Commit and push:**
   ```bash
   git add images/*.png
   git commit -m "Add visual assets for README"
   git push
   ```
4. **Images will automatically appear** in the README via GitHub raw URLs

---

## 📝 Current Status

- [ ] `ghz-circuit-12qubit-linear.png` - **Needed**
- [ ] `ghz-experimental-3-6qubit.png` - **Needed**
- [ ] `ghz-entanglement-multipartite.png` - **Needed**
- [ ] `multipartite-ghz-entanglement.png` - **Needed**
- [ ] `long-range-ghz-preparation.png` - **Needed**
- [ ] `ghz-fidelity-chart.png` - **Needed** (see `ghz-fidelity-chart.md`)

**Total:** 6 images needed

---

**Note:** The README is already configured to use these images via GitHub raw URLs. Once you add the images to this directory and commit them, they will automatically appear in the README.
