#!/usr/bin/env python3
"""
Periodic Table Quantum Frequency System
Using atomic frequencies from the periodic table for quantum operations
"""

import warnings
# Suppress Qiskit deprecation warnings for Python 3.9
warnings.filterwarnings('ignore', category=DeprecationWarning, module='qiskit')
warnings.filterwarnings('ignore', message='.*Python 3.9.*', category=DeprecationWarning)

import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from typing import Dict, List, Tuple, Optional
import time
import json
import math

class PeriodicTableQuantumFrequencies:
    """
    Quantum system using atomic frequencies from the periodic table.
    
    Leverages the entire periodic table of elements for quantum operations,
    not just atomic clock frequencies.
    """
    
    # Primary Atomic Clock Frequencies (SI Standards)
    ATOMIC_CLOCK_FREQUENCIES = {
        'Cesium-133': 9_192_631_770.0,      # Primary standard (SI definition of second)
        'Rubidium-87': 6_834_682_610.0,     # Secondary standard (GPS satellites)
        'Hydrogen-1': 1_420_405_752.0,      # Hydrogen maser (21 cm line)
        'Optical-Lattice': 429_228_004_229_873.0  # Experimental (strontium-87)
    }
    
    # Additional Atomic Frequencies (Common Elements)
    # These are representative frequencies - actual values depend on specific transitions
    ATOMIC_FREQUENCIES = {
        # Alkali Metals
        'Lithium-7': 803_504_086_000.0,     # Hyperfine transition
        'Sodium-23': 1_772_596_000_000.0,  # D-line transition
        'Potassium-39': 461_719_700_000.0, # Hyperfine transition
        
        # Alkaline Earth Metals
        'Calcium-40': 455_986_240_000_000.0,  # Optical transition
        'Strontium-87': 429_228_004_229_873.0,  # Optical lattice clock
        'Barium-138': 791_000_000_000_000.0,   # Optical transition
        
        # Noble Gases
        'Helium-4': 1_858_063_000_000_000.0,   # 2^3S-2^1P transition
        'Neon-20': 1_152_915_000_000_000.0,   # Optical transition
        'Argon-40': 811_000_000_000_000.0,    # Optical transition
        
        # Transition Metals
        'Iron-56': 384_000_000_000_000.0,      # Optical transition
        'Copper-63': 324_000_000_000_000.0,    # Optical transition
        'Zinc-64': 206_000_000_000_000.0,      # Optical transition
        
        # Other Important Elements
        'Carbon-12': 1_000_000_000_000_000.0,  # Representative (many transitions)
        'Nitrogen-14': 1_200_000_000_000_000.0, # Representative
        'Oxygen-16': 1_400_000_000_000_000.0,  # Representative
        'Silicon-28': 1_600_000_000_000_000.0, # Representative
        'Gold-197': 250_000_000_000_000.0,     # Optical transition
    }
    
    def __init__(self, backend=None, shots=1024):
        """
        Initialize periodic table quantum frequency system.
        
        Args:
            backend: Quantum backend (default: AerSimulator)
            shots: Number of measurement shots
        """
        self.backend = backend or AerSimulator()
        self.shots = shots
        
        # Combine all frequencies
        self.all_frequencies = {**self.ATOMIC_CLOCK_FREQUENCIES, **self.ATOMIC_FREQUENCIES}
    
    def get_frequency(self, element: str) -> Optional[float]:
        """
        Get atomic frequency for an element.
        
        Args:
            element: Element name (e.g., 'Cesium-133', 'Lithium-7')
        
        Returns:
            Frequency in Hz, or None if not found
        """
        return self.all_frequencies.get(element)
    
    def normalize_frequency(self, frequency: float, reference: float = None) -> float:
        """
        Normalize atomic frequency to [0, 1] range.
        
        Uses Cesium-133 as reference by default.
        
        Args:
            frequency: Atomic frequency in Hz
            reference: Reference frequency (default: Cesium-133)
        
        Returns:
            Normalized frequency [0, 1]
        """
        if reference is None:
            reference = self.ATOMIC_CLOCK_FREQUENCIES['Cesium-133']
        
        # Normalize: frequency / reference, then take fractional part
        normalized = (frequency / reference) % 1.0
        return normalized
    
    def create_atomic_frequency_circuit(
        self,
        elements: List[str],
        num_qubits: int = None,
        increase_diversity: bool = True
    ) -> QuantumCircuit:
        """
        Create quantum circuit using atomic frequencies from periodic table.
        
        Each element's frequency is encoded into a qubit.
        
        Args:
            elements: List of element names (e.g., ['Cesium-133', 'Rubidium-87'])
            num_qubits: Number of qubits (default: len(elements))
            increase_diversity: If True, add Hadamard gates for more state diversity
        
        Returns:
            QuantumCircuit: Circuit with atomic frequencies encoded
        """
        if num_qubits is None:
            num_qubits = len(elements)
        
        # Use Cesium-133 as reference
        reference_freq = self.ATOMIC_CLOCK_FREQUENCIES['Cesium-133']
        
        qr = QuantumRegister(num_qubits, 'atomic')
        cr = ClassicalRegister(num_qubits, 'measurement')
        qc = QuantumCircuit(qr, cr)
        
        # Start with superposition for more diversity (optional)
        if increase_diversity:
            for i in range(num_qubits):
                qc.h(qr[i])  # Hadamard creates equal superposition
        
        # Encode each element's frequency
        for i, element in enumerate(elements[:num_qubits]):
            freq = self.get_frequency(element)
            if freq is None:
                continue
            
            # Normalize frequency
            normalized = self.normalize_frequency(freq, reference_freq)
            
            # Encode as phase
            phase = normalized % 1.0
            qc.ry(2 * np.pi * phase, qr[i])
        
        # Create entanglement between atomic frequencies
        # This represents quantum coherence between different elements
        for i in range(num_qubits - 1):
            qc.cx(qr[i], qr[i + 1])
        
        # Apply golden ratio for optimal distribution
        golden_ratio = 1.618033988749895
        for i in range(num_qubits):
            qc.rz(2 * np.pi * golden_ratio * 0.05, qr[i])
        
        # Measurement
        qc.measure_all()
        
        return qc
    
    def calculate_frequency_harmonics(
        self,
        base_frequency: float,
        num_harmonics: int = 7
    ) -> List[float]:
        """
        Calculate harmonic series for an atomic frequency.
        
        Harmonics: f, 2f, 3f, 4f, 5f, 6f, 7f, ...
        
        Args:
            base_frequency: Base atomic frequency in Hz
            num_harmonics: Number of harmonics to calculate
        
        Returns:
            List of harmonic frequencies
        """
        harmonics = []
        for n in range(1, num_harmonics + 1):
            harmonic = base_frequency * n
            harmonics.append(harmonic)
        return harmonics
    
    def find_resonant_elements(
        self,
        target_frequency: float,
        tolerance: float = 0.01
    ) -> List[Tuple[str, float, float]]:
        """
        Find elements with frequencies resonant with target frequency.
        
        Resonance: frequencies that are harmonics or subharmonics of target.
        
        Args:
            target_frequency: Target frequency in Hz
            tolerance: Tolerance for resonance matching (0.01 = 1% relative)
        
        Returns:
            List of (element_name, frequency, resonance_ratio) tuples
            resonance_ratio: > 1.0 means element is N times target, < 1.0 means target is N times element
        """
        resonant = []
        
        for element, freq in self.all_frequencies.items():
            if freq <= 0:
                continue
            
            # Case 1: Element frequency is larger than target
            # Check if element frequency is a harmonic of target (element = N * target)
            if freq >= target_frequency:
                ratio = freq / target_frequency
                nearest_int = round(ratio)
                # Use relative tolerance: tolerance * ratio for large ratios
                relative_tolerance = max(tolerance, tolerance * ratio * 0.1)
                if abs(ratio - nearest_int) < relative_tolerance:
                    # Element frequency is approximately N times the target
                    resonant.append((element, freq, ratio))
            
            # Case 2: Element frequency is smaller than target
            # Check if target is a harmonic of element frequency (target = N * element)
            elif freq < target_frequency:
                ratio = target_frequency / freq
                nearest_int = round(ratio)
                # Use relative tolerance: tolerance * ratio for large ratios
                relative_tolerance = max(tolerance, tolerance * ratio * 0.1)
                if abs(ratio - nearest_int) < relative_tolerance:
                    # Target is approximately N times the element frequency
                    # Store as 1/ratio to indicate element is a subharmonic
                    resonant.append((element, freq, 1.0 / ratio))
        
        return resonant
    
    def create_multi_element_quantum_system(
        self,
        elements: List[str],
        operation: str = 'superposition'
    ) -> Dict:
        """
        Create quantum system using multiple elements from periodic table.
        
        Args:
            elements: List of element names
            operation: Quantum operation ('superposition', 'entanglement', 'interference')
        
        Returns:
            Quantum system results
        """
        start_time = time.time()
        
        # Get frequencies
        frequencies = []
        for element in elements:
            freq = self.get_frequency(element)
            if freq:
                frequencies.append((element, freq))
        
        if not frequencies:
            return {
                'success': False,
                'error': 'No valid elements found'
            }
        
        # Create quantum circuit with diversity enabled
        element_names = [e[0] for e in frequencies]
        circuit = self.create_atomic_frequency_circuit(element_names, increase_diversity=True)
        
        # Execute
        job = self.backend.run(circuit, shots=self.shots)
        result = job.result()
        counts = result.get_counts(circuit)
        
        # Calculate frequency relationships
        freq_values = [e[1] for e in frequencies]
        reference = self.ATOMIC_CLOCK_FREQUENCIES['Cesium-133']
        normalized_freqs = [self.normalize_frequency(f, reference) for f in freq_values]
        
        # Calculate frequency ratios
        ratios = []
        for i in range(len(freq_values) - 1):
            ratio = freq_values[i + 1] / freq_values[i] if freq_values[i] > 0 else 0
            ratios.append(ratio)
        
        execution_time = time.time() - start_time
        
        return {
            'success': True,
            'elements': [
                {
                    'name': element,
                    'frequency_hz': freq,
                    'normalized': round(normalized, 6)
                }
                for element, freq, normalized in zip(
                    element_names, freq_values, normalized_freqs
                )
            ],
            'frequency_relationships': {
                'ratios': [round(r, 6) for r in ratios],
                'reference': 'Cesium-133',
                'reference_frequency': reference
            },
            'quantum_metrics': {
                'circuit_depth': circuit.depth(),
                'gate_count': len(circuit.data),
                'execution_time_ms': round(execution_time * 1000, 2),
                'shots': self.shots
            },
            'quantum_counts': dict(sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            'operation': operation,
            'timestamp': time.time()
        }


def quantum_operation_with_elements(
    elements: List[str],
    operation: str = 'superposition',
    backend=None,
    shots=1024
) -> Dict:
    """
    Convenience function for quantum operations with periodic table elements.
    
    Args:
        elements: List of element names (e.g., ['Cesium-133', 'Rubidium-87'])
        operation: Quantum operation type
        backend: Quantum backend (optional)
        shots: Number of measurement shots
    
    Returns:
        Quantum operation results
    """
    system = PeriodicTableQuantumFrequencies(backend=backend, shots=shots)
    return system.create_multi_element_quantum_system(elements, operation)


if __name__ == "__main__":
    # Example: Quantum operation with atomic clock elements
    elements = ['Cesium-133', 'Rubidium-87', 'Hydrogen-1']
    
    result = quantum_operation_with_elements(elements, shots=512)
    print(json.dumps(result, indent=2))

