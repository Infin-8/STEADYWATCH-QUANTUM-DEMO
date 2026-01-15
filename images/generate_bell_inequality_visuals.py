#!/usr/bin/env python3
"""
Generate Bell Inequality Visuals
Creates circuit diagrams, flow charts, and comparison visuals for Bell Inequality breakthrough

Date: January 11, 2026
"""

import os
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle, FancyArrow
import numpy as np

# Try to import Qiskit for circuit diagrams
try:
    from qiskit import QuantumCircuit
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False
    print("⚠️  Qiskit not available, will create conceptual diagrams only")

# Set output directory
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_mermin_circuit_diagram(observable: str = "XXX"):
    """Create Mermin measurement circuit diagram for given observable"""
    
    num_qubits = 3
    fig, ax = plt.subplots(figsize=(14, 6))
    
    # Create actual circuit if Qiskit available
    if QISKIT_AVAILABLE:
        try:
            qc = QuantumCircuit(num_qubits)
            
            # GHZ Preparation
            qc.h(0)
            qc.cx(0, 1)
            qc.cx(1, 2)
            
            # Measurement Basis
            for i, basis in enumerate(observable):
                if basis == 'X':
                    qc.h(i)
                elif basis == 'Y':
                    qc.sdg(i)
                    qc.h(i)
            
            qc.measure_all()
            
            # Draw circuit
            fig = qc.draw('mpl', output='mpl', style='iqp', scale=0.8, 
                         initial_state=True, cregbundle=False)
            output_path = os.path.join(OUTPUT_DIR, f'mermin-measurement-circuit-{observable.lower()}.png')
            fig.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
            plt.close(fig)
            print(f"✅ Created: {output_path}")
            return True
        except Exception as e:
            print(f"⚠️  Qiskit drawing failed: {e}, creating conceptual diagram")
    
    # Fallback: Create conceptual diagram
    ax.set_xlim(0, 12)
    ax.set_ylim(-0.5, num_qubits - 0.5)
    ax.axis('off')
    ax.set_title(f'Mermin Measurement Circuit: {observable} Observable', 
                 fontsize=16, fontweight='bold', pad=20)
    
    # Draw qubit lines
    for i in range(num_qubits):
        ax.plot([0, 11], [i, i], 'k-', linewidth=2, alpha=0.3)
        ax.text(-0.5, i, f'q{i}', fontsize=12, ha='right', va='center', fontweight='bold')
    
    # GHZ Preparation section
    ax.text(1.5, num_qubits + 0.3, 'GHZ Preparation', fontsize=11, fontweight='bold', 
            ha='center', style='italic')
    
    # H gate on q0
    ax.add_patch(Rectangle((1, -0.2), 0.8, 0.4, facecolor='lightblue', edgecolor='black', linewidth=1.5))
    ax.text(1.4, 0, 'H', fontsize=10, ha='center', va='center', fontweight='bold')
    
    # CNOT gates
    for i in range(num_qubits - 1):
        x_pos = 2.5 + i * 1.5
        # Control dot
        ax.add_patch(Circle((x_pos, i), 0.1, facecolor='black', edgecolor='black'))
        # Target X
        ax.add_patch(Circle((x_pos, i + 1), 0.15, facecolor='white', edgecolor='black', linewidth=1.5))
        ax.plot([x_pos, x_pos], [i, i + 1], 'k-', linewidth=1.5)
        ax.text(x_pos, i + 1, '⊕', fontsize=12, ha='center', va='center', fontweight='bold')
    
    # Measurement Basis section
    ax.text(6.5, num_qubits + 0.3, 'Measurement Basis', fontsize=11, fontweight='bold', 
            ha='center', style='italic')
    
    # Basis gates
    for i, basis in enumerate(observable):
        x_pos = 6 + i * 1.5
        if basis == 'X':
            ax.add_patch(Rectangle((x_pos - 0.4, i - 0.2), 0.8, 0.4, 
                                  facecolor='lightgreen', edgecolor='black', linewidth=1.5))
            ax.text(x_pos, i, 'H', fontsize=10, ha='center', va='center', fontweight='bold')
        elif basis == 'Y':
            ax.add_patch(Rectangle((x_pos - 0.4, i - 0.2), 0.8, 0.4, 
                                  facecolor='lightyellow', edgecolor='black', linewidth=1.5))
            ax.text(x_pos, i, 'S†H', fontsize=8, ha='center', va='center', fontweight='bold')
    
    # Measurement section
    ax.text(10, num_qubits + 0.3, 'Measurement', fontsize=11, fontweight='bold', 
            ha='center', style='italic')
    
    for i in range(num_qubits):
        x_pos = 9.5 + i * 0.5
        ax.add_patch(Rectangle((x_pos - 0.2, i - 0.15), 0.4, 0.3, 
                              facecolor='lightcoral', edgecolor='black', linewidth=1.5))
        ax.text(x_pos, i, 'M', fontsize=9, ha='center', va='center', fontweight='bold')
    
    # Add legend
    legend_elements = [
        mpatches.Patch(facecolor='lightblue', edgecolor='black', label='H Gate (Superposition)'),
        mpatches.Patch(facecolor='lightgreen', edgecolor='black', label='X Basis (H)'),
        mpatches.Patch(facecolor='lightyellow', edgecolor='black', label='Y Basis (S†H)'),
        mpatches.Patch(facecolor='lightcoral', edgecolor='black', label='Measurement'),
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=9)
    
    output_path = os.path.join(OUTPUT_DIR, f'mermin-measurement-circuit-{observable.lower()}.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True


def create_quantum_randomness_flow():
    """Create quantum random number generation flow diagram"""
    
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_title('Quantum Random Number Generation Flow\n(Freedom-of-Choice Loophole Closure)', 
                 fontsize=16, fontweight='bold', pad=20)
    
    # Step 1: Create superposition
    box1 = FancyBboxPatch((0.5, 7.5), 2.5, 1, boxstyle="round,pad=0.1", 
                          facecolor='lightblue', edgecolor='black', linewidth=2)
    ax.add_patch(box1)
    ax.text(1.75, 8, '1. Create Superposition', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(1.75, 7.6, 'H gates on qubits', fontsize=9, ha='center', va='center')
    
    # Arrow 1
    arrow1 = FancyArrowPatch((3, 8), (4.5, 8), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow1)
    
    # Step 2: Measure
    box2 = FancyBboxPatch((4.5, 7.5), 2.5, 1, boxstyle="round,pad=0.1", 
                          facecolor='lightgreen', edgecolor='black', linewidth=2)
    ax.add_patch(box2)
    ax.text(5.75, 8, '2. Measure', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(5.75, 7.6, 'True quantum randomness', fontsize=9, ha='center', va='center')
    
    # Arrow 2
    arrow2 = FancyArrowPatch((7, 8), (7, 6.5), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow2)
    
    # Step 3: Generate random bits
    box3 = FancyBboxPatch((5.5, 5.5), 3, 1, boxstyle="round,pad=0.1", 
                          facecolor='lightyellow', edgecolor='black', linewidth=2)
    ax.add_patch(box3)
    ax.text(7, 6, '3. Generate Random Bits', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(7, 5.6, 'Binary string from measurement', fontsize=9, ha='center', va='center')
    
    # Arrow 3
    arrow3 = FancyArrowPatch((7, 5.5), (7, 4), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow3)
    
    # Step 4: Select basis
    box4 = FancyBboxPatch((5.5, 2.5), 3, 1, boxstyle="round,pad=0.1", 
                          facecolor='lightcoral', edgecolor='black', linewidth=2)
    ax.add_patch(box4)
    ax.text(7, 3, '4. Select Measurement Basis', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(7, 2.6, 'XXX, XYY, YXY, or YYX', fontsize=9, ha='center', va='center')
    
    # Side note: Independence
    side_box = FancyBboxPatch((0.5, 2.5), 3.5, 2, boxstyle="round,pad=0.1", 
                              facecolor='lightgray', edgecolor='blue', linewidth=2, linestyle='--')
    ax.add_patch(side_box)
    ax.text(2.25, 4, 'Independence Guarantee', fontsize=10, ha='center', va='center', 
            fontweight='bold', color='blue')
    ax.text(2.25, 3.5, '• Generated AFTER state prep', fontsize=8, ha='center', va='center')
    ax.text(2.25, 3.1, '• No correlation possible', fontsize=8, ha='center', va='center')
    ax.text(2.25, 2.7, '• Loophole CLOSED ✅', fontsize=8, ha='center', va='center', 
            fontweight='bold', color='green')
    
    # Add circuit diagram on the right
    ax.text(8.5, 8.5, 'QRNG Circuit:', fontsize=10, fontweight='bold')
    qc_box = FancyBboxPatch((8, 6.5), 1.8, 1.5, boxstyle="round,pad=0.05", 
                            facecolor='white', edgecolor='gray', linewidth=1)
    ax.add_patch(qc_box)
    ax.text(8.9, 7.5, 'q₀: ─H─M─', fontsize=9, ha='left', va='center', family='monospace')
    ax.text(8.9, 7.2, 'q₁: ─H─M─', fontsize=9, ha='left', va='center', family='monospace')
    ax.text(8.9, 6.9, 'q₂: ─H─M─', fontsize=9, ha='left', va='center', family='monospace')
    
    output_path = os.path.join(OUTPUT_DIR, 'quantum-randomness-flow.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True


def create_error_mitigation_pipeline():
    """Create error mitigation pipeline diagram"""
    
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 6)
    ax.axis('off')
    ax.set_title('Error Mitigation Pipeline\n(Bell Inequality Violation Detection)', 
                 fontsize=16, fontweight='bold', pad=20)
    
    # Raw Counts
    box1 = FancyBboxPatch((0.5, 2), 2, 2, boxstyle="round,pad=0.1", 
                          facecolor='lightcoral', edgecolor='black', linewidth=2)
    ax.add_patch(box1)
    ax.text(1.5, 3.5, 'Raw Counts', fontsize=12, ha='center', va='center', fontweight='bold')
    ax.text(1.5, 3, 'From Hardware', fontsize=9, ha='center', va='center')
    ax.text(1.5, 2.5, '|M| = 2.4512', fontsize=10, ha='center', va='center', 
            style='italic', color='darkred')
    
    # Arrow 1
    arrow1 = FancyArrowPatch((2.5, 3), (3.5, 3), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow1)
    
    # MEM
    box2 = FancyBboxPatch((3.5, 2), 2, 2, boxstyle="round,pad=0.1", 
                          facecolor='lightblue', edgecolor='black', linewidth=2)
    ax.add_patch(box2)
    ax.text(4.5, 3.5, 'Measurement Error', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(4.5, 3, 'Mitigation (MEM)', fontsize=9, ha='center', va='center')
    ax.text(4.5, 2.5, 'Correct readout errors', fontsize=8, ha='center', va='center')
    
    # Arrow 2
    arrow2 = FancyArrowPatch((5.5, 3), (6.5, 3), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow2)
    
    # Symmetry Verification
    box3 = FancyBboxPatch((6.5, 2), 2, 2, boxstyle="round,pad=0.1", 
                          facecolor='lightgreen', edgecolor='black', linewidth=2)
    ax.add_patch(box3)
    ax.text(7.5, 3.5, 'Symmetry', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(7.5, 3, 'Verification', fontsize=9, ha='center', va='center')
    ax.text(7.5, 2.5, 'GHZ state validation', fontsize=8, ha='center', va='center')
    
    # Arrow 3
    arrow3 = FancyArrowPatch((8.5, 3), (9.5, 3), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow3)
    
    # Post-Selection
    box4 = FancyBboxPatch((9.5, 2), 2, 2, boxstyle="round,pad=0.1", 
                          facecolor='lightyellow', edgecolor='black', linewidth=2)
    ax.add_patch(box4)
    ax.text(10.5, 3.5, 'Post-Selection', fontsize=11, ha='center', va='center', fontweight='bold')
    ax.text(10.5, 3, 'Filter invalid states', fontsize=9, ha='center', va='center')
    ax.text(10.5, 2.5, 'Keep |000⟩, |111⟩', fontsize=8, ha='center', va='center')
    
    # Arrow 4
    arrow4 = FancyArrowPatch((11.5, 3), (12.5, 3), arrowstyle='->', 
                             mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow4)
    
    # Mitigated Results
    box5 = FancyBboxPatch((12.5, 2), 2, 2, boxstyle="round,pad=0.1", 
                          facecolor='lightgreen', edgecolor='green', linewidth=3)
    ax.add_patch(box5)
    ax.text(13.5, 3.5, 'Mitigated', fontsize=12, ha='center', va='center', fontweight='bold')
    ax.text(13.5, 3, 'Results', fontsize=9, ha='center', va='center')
    ax.text(13.5, 2.5, '|M| = 3.7216 ✅', fontsize=10, ha='center', va='center', 
            style='italic', color='darkgreen', fontweight='bold')
    
    # Improvement annotation
    improvement_box = FancyBboxPatch((6, 0.5), 2, 1, boxstyle="round,pad=0.1", 
                                     facecolor='gold', edgecolor='orange', linewidth=2)
    ax.add_patch(improvement_box)
    ax.text(7, 1.2, 'Improvement:', fontsize=10, ha='center', va='center', fontweight='bold')
    ax.text(7, 0.7, '+51.83%', fontsize=11, ha='center', va='center', 
            fontweight='bold', color='darkgreen')
    
    output_path = os.path.join(OUTPUT_DIR, 'error-mitigation-pipeline.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True


def create_mermin_parameter_comparison():
    """Create comparison visual of raw vs mitigated Mermin parameters"""
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # Left: Raw Results
    ax1.set_xlim(-0.5, 3.5)
    ax1.set_ylim(-1.5, 1.5)
    ax1.axhline(y=0, color='k', linestyle='-', linewidth=0.5, alpha=0.3)
    ax1.axhline(y=2.0, color='r', linestyle='--', linewidth=2, label='Classical Limit')
    ax1.set_title('Raw (Unmitigated) Results', fontsize=14, fontweight='bold')
    ax1.set_xlabel('Observable', fontsize=11)
    ax1.set_ylabel('Expectation Value', fontsize=11)
    
    observables = ['XXX', 'XYY', 'YXY', 'YYX']
    raw_values = [-0.4808, -0.9808, -0.9744, -0.9768]
    colors = ['red' if v > 0 else 'blue' for v in raw_values]
    
    bars1 = ax1.bar(observables, raw_values, color=colors, alpha=0.7, edgecolor='black', linewidth=1.5)
    for i, (obs, val) in enumerate(zip(observables, raw_values)):
        ax1.text(i, val + 0.05 if val > 0 else val - 0.05, f'{val:.4f}', 
                ha='center', va='bottom' if val > 0 else 'top', fontsize=9, fontweight='bold')
    
    # Calculate raw M
    raw_m = raw_values[0] - sum(raw_values[1:])
    ax1.text(1.5, -1.3, f'|M| = {abs(raw_m):.4f}', fontsize=12, ha='center', 
            fontweight='bold', bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))
    ax1.text(1.5, -1.0, f'Violation: {abs(raw_m) - 2.0:+.4f}', fontsize=10, ha='center',
            fontweight='bold', color='green' if abs(raw_m) > 2.0 else 'red')
    
    ax1.legend(loc='upper right')
    ax1.grid(True, alpha=0.3)
    
    # Right: Mitigated Results
    ax2.set_xlim(-0.5, 3.5)
    ax2.set_ylim(-1.5, 1.5)
    ax2.axhline(y=0, color='k', linestyle='-', linewidth=0.5, alpha=0.3)
    ax2.axhline(y=2.0, color='r', linestyle='--', linewidth=2, label='Classical Limit')
    ax2.set_title('Mitigated Results', fontsize=14, fontweight='bold')
    ax2.set_xlabel('Observable', fontsize=11)
    ax2.set_ylabel('Expectation Value', fontsize=11)
    
    mitigated_values = [1.0000, -0.9256, -0.8920, -0.9040]
    colors2 = ['green' if v > 0 else 'blue' for v in mitigated_values]
    
    bars2 = ax2.bar(observables, mitigated_values, color=colors2, alpha=0.7, edgecolor='black', linewidth=1.5)
    for i, (obs, val) in enumerate(zip(observables, mitigated_values)):
        ax2.text(i, val + 0.05 if val > 0 else val - 0.05, f'{val:.4f}', 
                ha='center', va='bottom' if val > 0 else 'top', fontsize=9, fontweight='bold')
    
    # Calculate mitigated M
    mitigated_m = mitigated_values[0] - sum(mitigated_values[1:])
    ax2.text(1.5, -1.3, f'|M| = {abs(mitigated_m):.4f}', fontsize=12, ha='center', 
            fontweight='bold', bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.8))
    ax2.text(1.5, -1.0, f'Violation: {abs(mitigated_m) - 2.0:+.4f}', fontsize=10, ha='center',
            fontweight='bold', color='green')
    ax2.text(1.5, -0.7, f'93% of theoretical max!', fontsize=9, ha='center',
            style='italic', color='darkgreen')
    
    ax2.legend(loc='upper right')
    ax2.grid(True, alpha=0.3)
    
    plt.suptitle('Mermin Parameter Comparison: Raw vs Mitigated', 
                 fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    
    output_path = os.path.join(OUTPUT_DIR, 'mermin-parameter-comparison.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True


def main():
    """Generate all Bell Inequality visuals"""
    
    print("=" * 80)
    print("GENERATING BELL INEQUALITY VISUALS")
    print("=" * 80)
    print()
    
    results = []
    
    # Generate circuit diagrams for all observables
    observables = ["XXX", "XYY", "YXY", "YYX"]
    for obs in observables:
        try:
            results.append(create_mermin_circuit_diagram(obs))
        except Exception as e:
            print(f"❌ Error creating circuit for {obs}: {e}")
            results.append(False)
    
    # Generate flow diagrams
    try:
        results.append(create_quantum_randomness_flow())
    except Exception as e:
        print(f"❌ Error creating randomness flow: {e}")
        results.append(False)
    
    try:
        results.append(create_error_mitigation_pipeline())
    except Exception as e:
        print(f"❌ Error creating mitigation pipeline: {e}")
        results.append(False)
    
    try:
        results.append(create_mermin_parameter_comparison())
    except Exception as e:
        print(f"❌ Error creating comparison: {e}")
        results.append(False)
    
    print()
    print("=" * 80)
    print(f"✅ Generated {sum(results)}/{len(results)} visuals")
    print("=" * 80)
    print()
    print("Files created:")
    for obs in observables:
        print(f"  - mermin-measurement-circuit-{obs.lower()}.png")
    print("  - quantum-randomness-flow.png")
    print("  - error-mitigation-pipeline.png")
    print("  - mermin-parameter-comparison.png")
    print()
    print("Next steps:")
    print("  1. Review generated images")
    print("  2. Update documentation to reference these images")
    print("  3. Commit and push to repository")


if __name__ == "__main__":
    main()

