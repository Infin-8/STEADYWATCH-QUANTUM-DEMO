"""
Echo Resonance Quantum Circuits
Python implementation of echo resonance quantum circuits for IBM Quantum
"""

import warnings
# Suppress Qiskit Python 3.9 deprecation warning (temporary until Python upgrade)
warnings.filterwarnings('ignore', category=DeprecationWarning, module='qiskit')

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
import numpy as np


def create_echo_resonance_circuit(master_phase=0.0, echo_resonance_factor=0.1):
    """
    Create 4-point satellite echo resonance quantum circuit.
    
    Architecture:
        Master Clock (1 qubit) → 4 Satellites (4 qubits)
        Echo resonance creates natural synchronization
    
    Args:
        master_phase: Master clock phase (0.0 to 1.0)
        echo_resonance_factor: Echo resonance coefficient (0.1-0.3)
    
    Returns:
        QuantumCircuit: Echo resonance circuit
    """
    # Registers
    master_reg = QuantumRegister(1, 'master')
    satellite_reg = QuantumRegister(4, 'satellite')
    classical_reg = ClassicalRegister(4, 'measure')
    
    circuit = QuantumCircuit(master_reg, satellite_reg, classical_reg)
    
    # Master clock initialization (atomic clock sync)
    circuit.h(master_reg[0])  # Superposition state
    
    # Echo resonance: 4-directional satellites
    # Left, Right, Top, Bottom satellites
    golden_ratio = 1.618033988749895
    direction_offsets = [-1.0, 1.0, 0.0, 0.0]  # Left, Right, Top, Bottom
    
    for i in range(4):
        # Entangle satellite with master
        circuit.cx(master_reg[0], satellite_reg[i])
        
        # Echo offset based on direction and golden ratio
        echo_phase = master_phase + (direction_offsets[i] * echo_resonance_factor * golden_ratio)
        
        # Apply echo resonance phase gate
        circuit.rz(echo_phase * 2 * np.pi, satellite_reg[i])
    
    # Natural fusion measurement
    circuit.measure(satellite_reg, classical_reg)
    
    return circuit


def create_multi_qubit_grid_circuit(
    num_qubits=4,
    frequency_multipliers=None,
    phase_offsets=None,
    utc_seconds=None
):
    """
    Create multi-qubit grid circuit with harmonic-based superposition.
    
    Each qubit represents a row in the grid with:
    - Independent frequency multiplier
    - Phase offset (0.0 to 1.0)
    - UTC time synchronization
    
    Args:
        num_qubits: Number of qubits in grid
        frequency_multipliers: List of frequency multipliers (default: [0.5, 1.0, 2.0, 3.0, ...])
        phase_offsets: List of phase offsets 0.0-1.0 (default: evenly distributed)
        utc_seconds: UTC time in seconds (default: current time)
    
    Returns:
        QuantumCircuit: Multi-qubit grid circuit
    """
    import time
    
    if utc_seconds is None:
        utc_seconds = time.time()
    
    if frequency_multipliers is None:
        frequency_multipliers = [0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0][:num_qubits]
    
    if phase_offsets is None:
        phase_offsets = [i / num_qubits for i in range(num_qubits)]
    
    timeline_duration = 1.0  # 1 second cycle
    
    # Registers
    qubit_reg = QuantumRegister(num_qubits, 'qubit')
    classical_reg = ClassicalRegister(num_qubits, 'measure')
    circuit = QuantumCircuit(qubit_reg, classical_reg)
    
    # Calculate qubit progress for each qubit
    base_scaled_seconds = utc_seconds / timeline_duration
    golden_ratio = 1.618033988749895
    
    for i in range(num_qubits):
        # Qubit progress calculation
        qubit_progress = ((base_scaled_seconds * frequency_multipliers[i]) + phase_offsets[i]) % 1.0
        
        # Initialize qubit in superposition
        circuit.h(qubit_reg[i])
        
        # Apply phase based on qubit progress (golden ratio scaling)
        phase = qubit_progress * 2 * np.pi * golden_ratio
        circuit.rz(phase, qubit_reg[i])
        
        # Harmonic-based superposition (if frequency multiplier > 1)
        if frequency_multipliers[i] > 1.0:
            # Create harmonic state
            circuit.ry(np.pi / (2 * frequency_multipliers[i]), qubit_reg[i])
    
    # Measure all qubits
    circuit.measure(qubit_reg, classical_reg)
    
    return circuit


def create_harmonic_superposition_circuit(
    fundamental_frequency=1.0,
    harmonics=None,
    include_subharmonic=True,
    echo_resonance_factor=0.1
):
    """
    Create harmonic-based quantum superposition circuit.
    
    Formula:
        harmonicN_frequency = fundamental_frequency × N
        harmonicN_phase = (scaledSeconds × N) mod 1.0
        subharmonic_frequency = fundamental_frequency × 0.5
        subharmonic_phase = (scaledSeconds × 0.5) mod 1.0
    
    Args:
        fundamental_frequency: Fundamental frequency
        harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
        include_subharmonic: If True, include subharmonic (0.5x) qubit (default: True)
        echo_resonance_factor: Echo resonance coefficient
    
    Returns:
        QuantumCircuit: Harmonic superposition circuit with subharmonic
    """
    if harmonics is None:
        harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
    
    # Calculate number of qubits: fundamental + subharmonic (if included) + harmonics
    num_qubits = 1 + (1 if include_subharmonic else 0) + len(harmonics)
    qubit_reg = QuantumRegister(num_qubits, 'qubit')
    classical_reg = ClassicalRegister(num_qubits, 'measure')
    circuit = QuantumCircuit(qubit_reg, classical_reg)
    
    # Fundamental frequency qubit (qubit 0)
    circuit.h(qubit_reg[0])
    
    qubit_index = 1
    
    # Subharmonic qubit (0.5x speed - slower than fundamental)
    if include_subharmonic:
        # Create subharmonic state
        circuit.h(qubit_reg[qubit_index])
        
        # Entangle with fundamental (subharmonic relationship: 0.5x)
        circuit.cx(qubit_reg[0], qubit_reg[qubit_index])
        
        # Apply subharmonic phase (0.5x speed)
        subharmonic_phase = (0.5 * 2 * np.pi) % (2 * np.pi)
        circuit.rz(subharmonic_phase, qubit_reg[qubit_index])
        
        # Echo resonance for subharmonic
        echo_phase = subharmonic_phase * echo_resonance_factor
        circuit.rz(echo_phase, qubit_reg[qubit_index])
        
        qubit_index += 1
    
    # Harmonic qubits (2x, 3x, 4x, etc.)
    for harmonic in harmonics:
        # Create harmonic state
        circuit.h(qubit_reg[qubit_index])
        
        # Entangle with fundamental (harmonic relationship)
        circuit.cx(qubit_reg[0], qubit_reg[qubit_index])
        
        # Apply harmonic phase
        harmonic_phase = (harmonic * 2 * np.pi) % (2 * np.pi)
        circuit.rz(harmonic_phase, qubit_reg[qubit_index])
        
        # Echo resonance for harmonic
        echo_phase = harmonic_phase * echo_resonance_factor
        circuit.rz(echo_phase, qubit_reg[qubit_index])
        
        qubit_index += 1
    
    circuit.measure(qubit_reg, classical_reg)
    return circuit


def create_error_correction_circuit(num_data_qubits=3, num_ancilla_qubits=2):
    """
    Create quantum error correction circuit using echo resonance.
    
    Uses echo resonance for phase coherence analysis.
    
    Args:
        num_data_qubits: Number of data qubits
        num_ancilla_qubits: Number of ancilla qubits for error detection
    
    Returns:
        QuantumCircuit: Error correction circuit
    """
    data_reg = QuantumRegister(num_data_qubits, 'data')
    ancilla_reg = QuantumRegister(num_ancilla_qubits, 'ancilla')
    classical_reg = ClassicalRegister(num_data_qubits + num_ancilla_qubits, 'measure')
    
    circuit = QuantumCircuit(data_reg, ancilla_reg, classical_reg)
    
    # Initialize data qubits in superposition
    for i in range(num_data_qubits):
        circuit.h(data_reg[i])
    
    # Echo resonance synchronization
    golden_ratio = 1.618033988749895
    for i in range(num_data_qubits):
        # Apply echo resonance phase
        echo_phase = (i * golden_ratio * 2 * np.pi) % (2 * np.pi)
        circuit.rz(echo_phase, data_reg[i])
    
    # Ancilla qubits for error detection
    for i in range(num_ancilla_qubits):
        circuit.h(ancilla_reg[i])
        # Entangle with data qubits
        for j in range(num_data_qubits):
            circuit.cx(data_reg[j], ancilla_reg[i])
    
    circuit.measure(data_reg, classical_reg[:num_data_qubits])
    circuit.measure(ancilla_reg, classical_reg[num_data_qubits:])
    
    return circuit


def create_tesla_mode_circuit():
    """
    Create Tesla Mode circuit with 3-6-9 harmonics.
    
    Tesla Mode uses harmonics 3, 6, 9 for resonance pattern research.
    
    Returns:
        QuantumCircuit: Tesla Mode circuit
    """
    qubit_reg = QuantumRegister(4, 'qubit')  # 1 fundamental + 3 harmonics
    classical_reg = ClassicalRegister(4, 'measure')
    circuit = QuantumCircuit(qubit_reg, classical_reg)
    
    # Fundamental (qubit 0)
    circuit.h(qubit_reg[0])
    
    # Tesla harmonics: 3, 6, 9
    tesla_harmonics = [3, 6, 9]
    
    for i, harmonic in enumerate(tesla_harmonics):
        qubit_index = i + 1
        
        # Create harmonic state
        circuit.h(qubit_reg[qubit_index])
        
        # Entangle with fundamental
        circuit.cx(qubit_reg[0], qubit_reg[qubit_index])
        
        # Tesla resonance pattern
        tesla_phase = (harmonic * 2 * np.pi / 9) % (2 * np.pi)  # 3-6-9 pattern
        circuit.rz(tesla_phase, qubit_reg[qubit_index])
    
    circuit.measure(qubit_reg, classical_reg)
    return circuit


def create_singularity_measurement_circuit(
    harmonics=None,
    include_subharmonic=True
):
    """
    Create quantum circuit to measure all harmonic states at the Singularity.
    
    Mathematical Proof:
        At Singularity (base_phase = 0.0), all harmonics converge to phase 0.0.
        This makes the Singularity a perfect quantum measurement point where all
        harmonic states are known simultaneously.
    
    Formula:
        At Singularity (base_phase = 0.0):
        - Subharmonic (0.5x): phase = (0.0 × 0.5) mod 1.0 = 0.0
        - Fundamental (1x):   phase = (0.0 × 1.0) mod 1.0 = 0.0
        - Harmonic N:          phase = (0.0 × N) mod 1.0 = 0.0
    
    Args:
        harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
        include_subharmonic: If True, include subharmonic (0.5x) qubit
    
    Returns:
        QuantumCircuit: Singularity measurement circuit with all harmonics at phase 0.0
    """
    if harmonics is None:
        harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
    
    # Calculate number of qubits: fundamental + subharmonic (if included) + harmonics
    num_qubits = 1 + (1 if include_subharmonic else 0) + len(harmonics)
    qubit_reg = QuantumRegister(num_qubits, 'qubit')
    classical_reg = ClassicalRegister(num_qubits, 'measure')
    circuit = QuantumCircuit(qubit_reg, classical_reg)
    
    # At Singularity, all phases = 0.0, so all qubits are initialized to |0⟩
    # We still prepare them in superposition, but with phase = 0.0
    
    # Fundamental qubit (qubit 0) - phase = 0.0 at Singularity
    circuit.h(qubit_reg[0])  # Superposition
    # Phase = 0.0 (no phase gate needed at Singularity)
    
    qubit_index = 1
    
    # Subharmonic qubit (0.5x) - phase = 0.0 at Singularity
    if include_subharmonic:
        circuit.h(qubit_reg[qubit_index])  # Superposition
        # Entangle with fundamental
        circuit.cx(qubit_reg[0], qubit_reg[qubit_index])
        # Phase = 0.0 at Singularity (no phase gate needed)
        qubit_index += 1
    
    # Harmonic qubits (2x, 3x, 4x, etc.) - all phase = 0.0 at Singularity
    for harmonic in harmonics:
        circuit.h(qubit_reg[qubit_index])  # Superposition
        # Entangle with fundamental
        circuit.cx(qubit_reg[0], qubit_reg[qubit_index])
        # Phase = 0.0 at Singularity (no phase gate needed)
        qubit_index += 1
    
    # Measure all qubits simultaneously (perfect measurement point)
    circuit.measure(qubit_reg, classical_reg)
    
    return circuit

