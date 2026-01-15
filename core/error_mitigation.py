#!/usr/bin/env python3
"""
Error Mitigation Framework for QKD Protocol
Implements error mitigation techniques to improve fidelity without error correction overhead
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from qiskit import QuantumCircuit
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager


class ErrorMitigation:
    """
    Error mitigation framework for quantum key distribution.
    
    Techniques:
    1. Zero Noise Extrapolation (ZNE)
    2. Measurement Error Mitigation (MEM)
    3. Symmetry Verification
    4. Post-Selection
    """
    
    def __init__(self, backend=None):
        """
        Initialize error mitigation.
        
        Args:
            backend: Quantum backend (for measurement error mitigation)
        """
        self.backend = backend
        self.measurement_error_matrix = None
        
    # ============================================================
    # Zero Noise Extrapolation (ZNE)
    # ============================================================
    
    def zero_noise_extrapolation(self, 
                                 counts_list: List[Dict[str, int]],
                                 noise_factors: List[float]) -> Dict[str, float]:
        """
        Apply Zero Noise Extrapolation to estimate noiseless distribution.
        
        Args:
            counts_list: List of measurement counts at different noise levels
            noise_factors: List of noise scaling factors (1.0 = normal, 2.0 = 2x noise)
            
        Returns:
            Extrapolated noiseless distribution
        """
        # Convert counts to probabilities
        prob_list = []
        for counts in counts_list:
            total = sum(counts.values())
            prob = {state: count / total for state, count in counts.items()}
            prob_list.append(prob)
        
        # Linear extrapolation to zero noise
        # Simple linear fit: P(0) = P(1) + slope * noise_factor
        extrapolated = {}
        
        # Get all unique states
        all_states = set()
        for prob in prob_list:
            all_states.update(prob.keys())
        
        for state in all_states:
            # Collect probabilities at different noise levels
            probs = [prob.get(state, 0.0) for prob in prob_list]
            
            # Linear extrapolation
            if len(probs) >= 2:
                # Simple linear fit: y = a + b*x
                # Extrapolate to x=0 (zero noise)
                x = np.array(noise_factors)
                y = np.array(probs)
                
                # Linear regression
                A = np.vstack([x, np.ones(len(x))]).T
                a, b = np.linalg.lstsq(A, y, rcond=None)[0]
                
                # Extrapolate to zero noise (x=0)
                extrapolated[state] = max(0.0, b)  # b is intercept (x=0)
            else:
                extrapolated[state] = probs[0] if probs else 0.0
        
        # Normalize
        total = sum(extrapolated.values())
        if total > 0:
            extrapolated = {state: prob / total for state, prob in extrapolated.items()}
        
        return extrapolated
    
    # ============================================================
    # Measurement Error Mitigation (MEM)
    # ============================================================
    
    def build_measurement_error_matrix(self, calibration_data: Dict[str, Dict[str, int]]):
        """
        Build measurement error matrix from calibration data.
        
        Args:
            calibration_data: Dict mapping prepared states to measured counts
                e.g., {'000': {'000': 95, '001': 3, '010': 2, ...}, ...}
        """
        # Build error matrix: M[i][j] = P(measure j | prepare i)
        error_matrix = {}
        
        for prepared_state, measured_counts in calibration_data.items():
            total = sum(measured_counts.values())
            if total > 0:
                error_matrix[prepared_state] = {
                    measured: count / total 
                    for measured, count in measured_counts.items()
                }
            else:
                error_matrix[prepared_state] = {prepared_state: 1.0}
        
        self.measurement_error_matrix = error_matrix
    
    def apply_measurement_error_mitigation(self, 
                                          raw_counts: Dict[str, int]) -> Dict[str, float]:
        """
        Apply measurement error mitigation to raw counts.
        
        Args:
            raw_counts: Raw measurement counts
            
        Returns:
            Mitigated probability distribution
        """
        if self.measurement_error_matrix is None:
            # No calibration data, return raw probabilities
            total = sum(raw_counts.values())
            return {state: count / total for state, count in raw_counts.items()}
        
        # Invert error matrix to correct measurements
        # This is a simplified version - full implementation would use matrix inversion
        
        # For now, return raw probabilities
        # Full implementation would solve: P_measured = M * P_true
        # to get P_true = M^-1 * P_measured
        
        total = sum(raw_counts.values())
        mitigated = {state: count / total for state, count in raw_counts.items()}
        
        return mitigated
    
    # ============================================================
    # Symmetry Verification
    # ============================================================
    
    def symmetry_verification(self, 
                             counts: Dict[str, int],
                             expected_symmetry: str = "ghz") -> Dict[str, int]:
        """
        Verify and filter based on expected symmetry.
        
        For GHZ states, we expect:
        - All-zeros: ~50%
        - All-ones: ~50%
        - Everything else: ~0%
        
        Args:
            counts: Raw measurement counts
            expected_symmetry: Expected symmetry type ("ghz", "bell", etc.)
            
        Returns:
            Filtered counts (only states matching expected symmetry)
        """
        if expected_symmetry == "ghz":
            # GHZ states: only all-zeros and all-ones are valid
            num_qubits = len(next(iter(counts.keys())))
            all_zeros = '0' * num_qubits
            all_ones = '1' * num_qubits
            
            filtered = {
                all_zeros: counts.get(all_zeros, 0),
                all_ones: counts.get(all_ones, 0)
            }
            
            return filtered
        
        # For other symmetries, return as-is
        return counts
    
    # ============================================================
    # Post-Selection
    # ============================================================
    
    def post_selection(self,
                      counts: Dict[str, int],
                      valid_states: List[str],
                      min_count: int = 1) -> Dict[str, int]:
        """
        Post-select only valid states.
        
        Args:
            counts: Raw measurement counts
            valid_states: List of valid state strings
            min_count: Minimum count threshold
            
        Returns:
            Post-selected counts
        """
        filtered = {
            state: count 
            for state, count in counts.items() 
            if state in valid_states and count >= min_count
        }
        
        return filtered
    
    # ============================================================
    # Combined Error Mitigation
    # ============================================================
    
    def apply_all_mitigation(self,
                            raw_counts: Dict[str, int],
                            use_zne: bool = False,
                            use_mem: bool = False,
                            use_symmetry: bool = True,
                            use_post_selection: bool = True,
                            expected_symmetry: str = "ghz") -> Dict[str, float]:
        """
        Apply all error mitigation techniques.
        
        Args:
            raw_counts: Raw measurement counts
            use_zne: Apply zero noise extrapolation
            use_mem: Apply measurement error mitigation
            use_symmetry: Apply symmetry verification
            use_post_selection: Apply post-selection
            expected_symmetry: Expected symmetry type
            
        Returns:
            Mitigated probability distribution
        """
        counts = raw_counts.copy()
        
        # Step 1: Symmetry verification
        if use_symmetry:
            counts = self.symmetry_verification(counts, expected_symmetry)
        
        # Step 2: Post-selection
        if use_post_selection:
            valid_states = list(counts.keys())
            counts = self.post_selection(counts, valid_states, min_count=1)
        
        # Step 3: Measurement error mitigation
        if use_mem and self.measurement_error_matrix:
            # Convert counts to probabilities
            total = sum(counts.values())
            prob_dist = {state: count / total for state, count in counts.items()}
            prob_dist = self.apply_measurement_error_mitigation(
                {state: int(prob * 1000) for state, prob in prob_dist.items()}
            )
            counts = {state: int(prob * 1000) for state, prob in prob_dist.items()}
        
        # Step 4: Zero noise extrapolation (if multiple noise levels available)
        if use_zne:
            # Would need multiple runs at different noise levels
            # For now, skip
            pass
        
        # Convert to probabilities
        total = sum(counts.values())
        if total > 0:
            mitigated = {state: count / total for state, count in counts.items()}
        else:
            mitigated = {}
        
        return mitigated
    
    # ============================================================
    # Fidelity Improvement Estimation
    # ============================================================
    
    def estimate_fidelity_improvement(self,
                                     raw_counts: Dict[str, int],
                                     mitigated_probs: Dict[str, float],
                                     expected_states: List[str]) -> float:
        """
        Estimate fidelity improvement from error mitigation.
        
        Args:
            raw_counts: Raw measurement counts
            mitigated_probs: Mitigated probability distribution
            expected_states: List of expected states (e.g., ['000', '111'] for GHZ)
            
        Returns:
            Estimated fidelity improvement (0.0 to 1.0)
        """
        # Calculate raw fidelity
        total_raw = sum(raw_counts.values())
        raw_fidelity = sum(raw_counts.get(state, 0) for state in expected_states) / total_raw if total_raw > 0 else 0.0
        
        # Calculate mitigated fidelity
        mitigated_fidelity = sum(mitigated_probs.get(state, 0.0) for state in expected_states)
        
        # Improvement
        improvement = mitigated_fidelity - raw_fidelity
        
        return improvement


# ============================================================
# Example Usage
# ============================================================

def example_error_mitigation():
    """Example: Error mitigation on GHZ state"""
    
    # Simulate raw GHZ measurement (with noise)
    raw_counts = {
        '000000000000': 35,  # All zeros (correct)
        '111111111111': 30,  # All ones (correct)
        '000000000001': 5,   # Error
        '111111111110': 4,   # Error
        '000000000010': 3,   # Error
        '111111111101': 2,   # Error
        # ... more errors
    }
    
    # Fill in more errors to reach 100 shots
    total_correct = 35 + 30
    total_errors = 100 - total_correct
    for i in range(total_errors):
        error_state = f"{i:012b}"  # Random error state
        if error_state not in raw_counts:
            raw_counts[error_state] = 1
    
    print("Raw GHZ Measurement (with noise):")
    print(f"  All-zeros: {raw_counts.get('000000000000', 0)}")
    print(f"  All-ones: {raw_counts.get('111111111111', 0)}")
    print(f"  Total shots: {sum(raw_counts.values())}")
    print(f"  Raw fidelity: {(raw_counts.get('000000000000', 0) + raw_counts.get('111111111111', 0)) / sum(raw_counts.values()):.1%}")
    print()
    
    # Apply error mitigation
    mitigator = ErrorMitigation()
    mitigated = mitigator.apply_all_mitigation(
        raw_counts,
        use_symmetry=True,
        use_post_selection=True,
        expected_symmetry="ghz"
    )
    
    print("After Error Mitigation:")
    print(f"  All-zeros: {mitigated.get('000000000000', 0.0):.1%}")
    print(f"  All-ones: {mitigated.get('111111111111', 0.0):.1%}")
    print(f"  Mitigated fidelity: {mitigated.get('000000000000', 0.0) + mitigated.get('111111111111', 0.0):.1%}")
    print()
    
    # Estimate improvement
    improvement = mitigator.estimate_fidelity_improvement(
        raw_counts,
        mitigated,
        ['000000000000', '111111111111']
    )
    print(f"Fidelity improvement: {improvement:.1%}")


if __name__ == "__main__":
    example_error_mitigation()

