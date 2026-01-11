#!/usr/bin/env python3
"""
Generate visual assets for SteadyWatch Quantum Demo README
Creates circuit diagrams, conceptual illustrations, and data visualizations
"""

import os
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
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

def create_12qubit_circuit():
    """Create 12-qubit GHZ circuit diagram"""
    if QISKIT_AVAILABLE:
        # Create 12-qubit GHZ circuit
        qc = QuantumCircuit(12)
        qc.h(0)  # Initialize first qubit
        for i in range(11):
            qc.cx(i, i+1)  # Entangle qubits
        
        # Draw circuit
        try:
            fig = qc.draw('mpl', output='mpl', style='iqp', scale=0.8)
            output_path = os.path.join(OUTPUT_DIR, 'ghz-circuit-12qubit-linear.png')
            fig.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
            plt.close(fig)
            print(f"✅ Created: {output_path}")
            return True
        except Exception as e:
            print(f"⚠️  Qiskit MPL drawing failed: {e}, creating conceptual diagram")
    
    # Fallback: Create conceptual diagram
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # Draw qubits
    for i in range(12):
        y = 11 - i
        # Qubit line
        ax.plot([0, 10], [y, y], 'k-', linewidth=1.5, alpha=0.3)
        # Qubit label
        ax.text(-0.5, y, f'q[{i}]', ha='right', va='center', fontsize=10, fontweight='bold')
        # Qubit circle
        circle = Circle((0.5, y), 0.15, color='lightblue', ec='black', linewidth=1.5)
        ax.add_patch(circle)
    
    # Draw H gate on first qubit
    h_box = FancyBboxPatch((1.5, 10.85), 0.8, 0.3, boxstyle="round,pad=0.05", 
                          facecolor='lightgreen', edgecolor='black', linewidth=1.5)
    ax.add_patch(h_box)
    ax.text(1.9, 11, 'H', ha='center', va='center', fontsize=12, fontweight='bold')
    
    # Draw CNOT gates
    for i in range(11):
        y_control = 11 - i
        y_target = 11 - (i + 1)
        x_pos = 3 + i * 0.6
        
        # Control qubit (circle)
        control = Circle((x_pos, y_control), 0.1, color='white', ec='black', linewidth=2)
        ax.add_patch(control)
        
        # Target qubit (box with +)
        target_box = FancyBboxPatch((x_pos - 0.15, y_target - 0.15), 0.3, 0.3,
                                   boxstyle="round,pad=0.02", facecolor='lightcoral', 
                                   edgecolor='black', linewidth=2)
        ax.add_patch(target_box)
        ax.text(x_pos, y_target, '+', ha='center', va='center', fontsize=14, fontweight='bold')
        
        # Connection line
        ax.plot([x_pos, x_pos], [y_control, y_target], 'k-', linewidth=2)
    
    ax.set_title('12-Qubit GHZ Circuit\n(H gate + CX chain entanglement)', 
                 fontsize=14, fontweight='bold', pad=20)
    
    output_path = os.path.join(OUTPUT_DIR, 'ghz-circuit-12qubit-linear.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def create_3_6qubit_circuit():
    """Create 3-6 qubit GHZ circuit diagram"""
    if QISKIT_AVAILABLE:
        # Create 6-qubit GHZ circuit (extendable to 12)
        qc = QuantumCircuit(6)
        qc.h(0)
        for i in range(5):
            qc.cx(i, i+1)
        
        try:
            fig = qc.draw('mpl', output='mpl', style='iqp', scale=0.9)
            output_path = os.path.join(OUTPUT_DIR, 'ghz-experimental-3-6qubit.png')
            fig.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
            plt.close(fig)
            print(f"✅ Created: {output_path}")
            return True
        except Exception as e:
            print(f"⚠️  Qiskit MPL drawing failed: {e}, creating conceptual diagram")
    
    # Fallback: Create conceptual diagram
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 7)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    # Draw 6 qubits
    for i in range(6):
        y = 5 - i
        ax.plot([0, 7], [y, y], 'k-', linewidth=1.5, alpha=0.3)
        ax.text(-0.5, y, f'q[{i}]', ha='right', va='center', fontsize=9, fontweight='bold')
        circle = Circle((0.5, y), 0.12, color='lightblue', ec='black', linewidth=1.5)
        ax.add_patch(circle)
    
    # H gate
    h_box = FancyBboxPatch((1.5, 4.85), 0.7, 0.3, boxstyle="round,pad=0.05",
                          facecolor='lightgreen', edgecolor='black', linewidth=1.5)
    ax.add_patch(h_box)
    ax.text(1.85, 5, 'H', ha='center', va='center', fontsize=11, fontweight='bold')
    
    # CNOT gates
    for i in range(5):
        y_control = 5 - i
        y_target = 5 - (i + 1)
        x_pos = 3 + i * 0.7
        
        control = Circle((x_pos, y_control), 0.08, color='white', ec='black', linewidth=2)
        ax.add_patch(control)
        
        target_box = FancyBboxPatch((x_pos - 0.12, y_target - 0.12), 0.24, 0.24,
                                   boxstyle="round,pad=0.02", facecolor='lightcoral',
                                   edgecolor='black', linewidth=2)
        ax.add_patch(target_box)
        ax.text(x_pos, y_target, '+', ha='center', va='center', fontsize=12, fontweight='bold')
        ax.plot([x_pos, x_pos], [y_control, y_target], 'k-', linewidth=2)
    
    ax.set_title('6-Qubit GHZ Circuit\n(Extendable to 12 qubits)', 
                 fontsize=12, fontweight='bold', pad=15)
    
    output_path = os.path.join(OUTPUT_DIR, 'ghz-experimental-3-6qubit.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def create_entanglement_visualization():
    """Create GHZ entanglement visualization"""
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(-1, 11)
    ax.set_ylim(-1, 7)
    ax.axis('off')
    
    # Draw 12 qubits in a circle
    num_qubits = 12
    center_x, center_y = 5, 3
    radius = 3
    
    qubit_positions = []
    for i in range(num_qubits):
        angle = 2 * np.pi * i / num_qubits - np.pi/2
        x = center_x + radius * np.cos(angle)
        y = center_y + radius * np.sin(angle)
        qubit_positions.append((x, y))
        
        # Draw qubit
        circle = Circle((x, y), 0.3, color='lightblue', ec='darkblue', linewidth=2.5)
        ax.add_patch(circle)
        ax.text(x, y, f'q{i}', ha='center', va='center', fontsize=8, fontweight='bold')
    
    # Draw entanglement connections (all-to-all for GHZ)
    for i in range(num_qubits):
        for j in range(i + 1, num_qubits):
            x1, y1 = qubit_positions[i]
            x2, y2 = qubit_positions[j]
            ax.plot([x1, x2], [y1, y2], 'r-', linewidth=1, alpha=0.3, linestyle='--')
    
    # Highlight center (entangled state)
    center_circle = Circle((center_x, center_y), 0.5, color='yellow', 
                          ec='orange', linewidth=3, alpha=0.7)
    ax.add_patch(center_circle)
    ax.text(center_x, center_y, 'GHZ\nState', ha='center', va='center', 
           fontsize=10, fontweight='bold')
    
    ax.set_title('12-Qubit GHZ Entanglement\nPerfect Correlation Across All Qubits', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Add legend
    legend_elements = [
        mpatches.Patch(facecolor='lightblue', edgecolor='darkblue', label='Qubit'),
        mpatches.Patch(facecolor='yellow', edgecolor='orange', label='GHZ State'),
        plt.Line2D([0], [0], color='red', linestyle='--', alpha=0.5, label='Entanglement')
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    output_path = os.path.join(OUTPUT_DIR, 'ghz-entanglement-multipartite.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def create_multipartite_ghz():
    """Create multipartite GHZ entanglement illustration"""
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(-1, 11)
    ax.set_ylim(-1, 7)
    ax.axis('off')
    
    # Draw qubits in a network pattern
    positions = [
        (2, 5), (5, 5), (8, 5),  # Top row
        (1, 3), (3.5, 3), (6.5, 3), (9, 3),  # Middle row
        (2, 1), (5, 1), (8, 1)  # Bottom row
    ]
    
    qubits = []
    for i, (x, y) in enumerate(positions):
        circle = Circle((x, y), 0.35, color='lightblue', ec='darkblue', linewidth=2.5)
        ax.add_patch(circle)
        ax.text(x, y, f'q{i}', ha='center', va='center', fontsize=9, fontweight='bold')
        qubits.append((x, y))
    
    # Draw entanglement connections (GHZ pattern)
    # Connect all qubits to show multipartite entanglement
    for i in range(len(qubits)):
        for j in range(i + 1, len(qubits)):
            x1, y1 = qubits[i]
            x2, y2 = qubits[j]
            # Use different colors for different entanglement groups
            if i < 3 and j < 3:
                color = 'red'
            elif i >= 3 and j >= 3:
                color = 'green'
            else:
                color = 'purple'
            ax.plot([x1, x2], [y1, y2], color=color, linewidth=1.5, alpha=0.4, linestyle='--')
    
    ax.set_title('Multipartite GHZ Entanglement\nMultiple Qubits in Correlated States', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Add legend
    legend_elements = [
        mpatches.Patch(facecolor='lightblue', edgecolor='darkblue', label='Qubit'),
        plt.Line2D([0], [0], color='red', linestyle='--', alpha=0.5, label='Group 1'),
        plt.Line2D([0], [0], color='green', linestyle='--', alpha=0.5, label='Group 2'),
        plt.Line2D([0], [0], color='purple', linestyle='--', alpha=0.5, label='Cross-group')
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    output_path = os.path.join(OUTPUT_DIR, 'multipartite-ghz-entanglement.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def create_network_diagram():
    """Create long-range GHZ preparation network diagram"""
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(-1, 13)
    ax.set_ylim(-1, 7)
    ax.axis('off')
    
    # Define network nodes
    nodes = {
        'Alice': (1, 3),
        'Relay1': (4, 5),
        'Relay2': (7, 3),
        'Relay3': (10, 5),
        'Bob': (12, 3)
    }
    
    # Draw nodes
    for name, (x, y) in nodes.items():
        if name.startswith('Relay'):
            # Relay nodes (smaller)
            circle = Circle((x, y), 0.4, color='lightyellow', ec='orange', linewidth=2.5)
            ax.add_patch(circle)
            ax.text(x, y, name[-1], ha='center', va='center', fontsize=10, fontweight='bold')
        else:
            # Alice and Bob (larger)
            circle = Circle((x, y), 0.5, color='lightblue', ec='darkblue', linewidth=3)
            ax.add_patch(circle)
            ax.text(x, y, name, ha='center', va='center', fontsize=11, fontweight='bold')
        
        # Node label
        label_y = y - 0.8 if y > 3 else y + 0.8
        ax.text(x, label_y, name, ha='center', va='center', fontsize=9)
    
    # Draw network connections
    connections = [
        ('Alice', 'Relay1'),
        ('Relay1', 'Relay2'),
        ('Relay2', 'Relay3'),
        ('Relay3', 'Bob')
    ]
    
    for start, end in connections:
        x1, y1 = nodes[start]
        x2, y2 = nodes[end]
        ax.plot([x1, x2], [y1, y2], 'k-', linewidth=2.5, alpha=0.6)
        # Add arrow
        dx, dy = x2 - x1, y2 - y1
        length = np.sqrt(dx**2 + dy**2)
        dx_norm, dy_norm = dx/length, dy/length
        arrow = FancyArrowPatch((x1 + dx_norm*0.5, y1 + dy_norm*0.5),
                               (x2 - dx_norm*0.5, y2 - dy_norm*0.5),
                               arrowstyle='->', mutation_scale=20, 
                               color='darkgreen', linewidth=2)
        ax.add_patch(arrow)
    
    # Add GHZ state labels
    ax.text(6.5, 6, 'GHZ Entanglement Path', ha='center', va='center',
           fontsize=12, fontweight='bold', style='italic',
           bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.3))
    
    ax.set_title('Long-Range GHZ Preparation\nMulti-Hop Network with Relay Nodes', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Add legend
    legend_elements = [
        mpatches.Patch(facecolor='lightblue', edgecolor='darkblue', label='End Node (Alice/Bob)'),
        mpatches.Patch(facecolor='lightyellow', edgecolor='orange', label='Relay Node'),
        plt.Line2D([0], [0], color='darkgreen', linewidth=2, label='GHZ Path')
    ]
    ax.legend(handles=legend_elements, loc='lower right', fontsize=10)
    
    output_path = os.path.join(OUTPUT_DIR, 'long-range-ghz-preparation.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def create_fidelity_chart():
    """Create GHZ fidelity bar chart"""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Data from hardware validation
    categories = ['All-zeros\n(Perfect)', 'All-ones\n(Perfect)', 'Errors']
    counts = [39, 30, 31]
    percentages = [39.0, 30.0, 31.0]
    colors = ['green', 'green', 'red']
    
    # Create bar chart
    bars = ax.bar(categories, counts, color=colors, alpha=0.7, edgecolor='black', linewidth=2)
    
    # Add value labels on bars
    for i, (bar, count, pct) in enumerate(zip(bars, counts, percentages)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 1,
               f'{count}\n({pct:.1f}%)',
               ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Customize chart
    ax.set_ylabel('Counts', fontsize=12, fontweight='bold')
    ax.set_title('12-Qubit GHZ State Measurement Results\n69% Fidelity (Hardware: ibm_fez)', 
                 fontsize=14, fontweight='bold', pad=15)
    ax.set_ylim(0, max(counts) * 1.2)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    
    # Add fidelity annotation
    ax.text(0.5, 0.95, 'Total Fidelity: 69.0%', transform=ax.transAxes,
           fontsize=13, fontweight='bold', ha='center',
           bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.5))
    
    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, 'ghz-fidelity-chart.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ Created: {output_path}")
    return True

def main():
    """Generate all images"""
    print("=" * 60)
    print("Generating Visual Assets for SteadyWatch Quantum Demo")
    print("=" * 60)
    print()
    
    results = []
    
    print("1. Creating 12-qubit GHZ circuit diagram...")
    results.append(("12-qubit circuit", create_12qubit_circuit()))
    print()
    
    print("2. Creating 3-6 qubit GHZ circuit diagram...")
    results.append(("3-6 qubit circuit", create_3_6qubit_circuit()))
    print()
    
    print("3. Creating GHZ entanglement visualization...")
    results.append(("Entanglement viz", create_entanglement_visualization()))
    print()
    
    print("4. Creating multipartite GHZ illustration...")
    results.append(("Multipartite GHZ", create_multipartite_ghz()))
    print()
    
    print("5. Creating long-range GHZ network diagram...")
    results.append(("Network diagram", create_network_diagram()))
    print()
    
    print("6. Creating fidelity bar chart...")
    results.append(("Fidelity chart", create_fidelity_chart()))
    print()
    
    # Summary
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    success_count = sum(1 for _, success in results if success)
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    print()
    print(f"Successfully created {success_count}/{len(results)} images")
    print(f"Images saved to: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()

