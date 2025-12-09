"""
Echo Resonance Mathematical Calculations
Pure Python implementations of echo resonance formulas
"""

import numpy as np


def calculate_echo_resonance(master_phase, echo_resonance_factor=0.1):
    """
    Calculate echo resonance for 4-point satellite system.
    
    Formula:
        masterPhase = (UTC_seconds / timelineDuration) mod 1.0
        satellitePhase = masterPhase + echoOffset
        echoOffset = controlledVariation × echoResonanceFactor
        leftEcho = satellitePhase - bilateralOffset
        rightEcho = satellitePhase + bilateralOffset
        topEcho = satellitePhase + verticalOffset
        bottomEcho = satellitePhase - verticalOffset
        fusedData = (leftEcho + rightEcho + topEcho + bottomEcho) / 4.0
    
    Args:
        master_phase: Master clock phase (0.0 to 1.0)
        echo_resonance_factor: Echo resonance coefficient (0.1-0.3)
    
    Returns:
        dict: Echo resonance data with all satellite phases and fused data
    """
    golden_ratio = 1.618033988749895
    
    # 4-directional echo offsets
    left_offset = -1.0 * echo_resonance_factor * golden_ratio
    right_offset = 1.0 * echo_resonance_factor * golden_ratio
    top_offset = 0.0 * echo_resonance_factor * golden_ratio
    bottom_offset = 0.0 * echo_resonance_factor * golden_ratio
    
    # Satellite phases
    left_echo = (master_phase + left_offset) % 1.0
    right_echo = (master_phase + right_offset) % 1.0
    top_echo = (master_phase + top_offset) % 1.0
    bottom_echo = (master_phase + bottom_offset) % 1.0
    
    # Natural fusion
    fused_data = (left_echo + right_echo + top_echo + bottom_echo) / 4.0
    
    return {
        'master_phase': master_phase,
        'left_echo': left_echo,
        'right_echo': right_echo,
        'top_echo': top_echo,
        'bottom_echo': bottom_echo,
        'fused_data': fused_data,
        'echo_resonance_factor': echo_resonance_factor
    }


def calculate_qubit_progress(utc_seconds, frequency_multiplier, phase_offset, timeline_duration=1.0):
    """
    Calculate qubit progress for multi-qubit grid.
    
    Formula:
        baseScaledSeconds = UTC_seconds / timelineDuration
        qubitProgress = ((baseScaledSeconds × frequencyMultiplier) + phaseOffset) mod 1.0
    
    Args:
        utc_seconds: UTC time in seconds
        frequency_multiplier: Frequency multiplier (0.5x, 1x, 2x, etc.)
        phase_offset: Phase offset (0.0 to 1.0)
        timeline_duration: Timeline duration in seconds (default: 1.0)
    
    Returns:
        float: Qubit progress (0.0 to 1.0)
    """
    base_scaled_seconds = utc_seconds / timeline_duration
    qubit_progress = ((base_scaled_seconds * frequency_multiplier) + phase_offset) % 1.0
    return qubit_progress


def calculate_harmonic_phase(harmonic_number, base_phase):
    """
    Calculate harmonic phase for harmonic-based superposition.
    
    Formula:
        harmonicN_phase = (basePhase × N) mod 1.0
        harmonicN_frequency = fundamental_frequency × N
    
    Args:
        harmonic_number: Harmonic number (2, 3, 4, etc.)
        base_phase: Base phase (0.0 to 1.0)
    
    Returns:
        float: Harmonic phase (0.0 to 1.0)
    """
    harmonic_phase = (base_phase * harmonic_number) % 1.0
    return harmonic_phase


def calculate_subharmonic_phase(base_phase):
    """
    Calculate subharmonic phase (0.5x speed - slower than fundamental).
    
    Formula:
        subharmonic_phase = (basePhase × 0.5) mod 1.0
        subharmonic_frequency = fundamental_frequency × 0.5
    
    The subharmonic moves at half the speed of the fundamental frequency,
    creating a slower, larger wave that fills gaps in music (double drum bass effect).
    
    Args:
        base_phase: Base phase (0.0 to 1.0)
    
    Returns:
        float: Subharmonic phase (0.0 to 1.0)
    """
    subharmonic_phase = (base_phase * 0.5) % 1.0
    return subharmonic_phase


def calculate_golden_ratio_phase(phase, golden_ratio=1.618033988749895):
    """
    Calculate golden ratio scaled phase.
    
    Args:
        phase: Base phase (0.0 to 1.0)
        golden_ratio: Golden ratio constant (default: 1.618033988749895)
    
    Returns:
        float: Golden ratio scaled phase
    """
    return (phase * golden_ratio) % 1.0


def calculate_tesla_resonance(harmonic):
    """
    Calculate Tesla Mode resonance pattern (3-6-9 harmonics).
    
    Args:
        harmonic: Harmonic number (3, 6, or 9)
    
    Returns:
        float: Tesla resonance phase
    """
    tesla_phase = (harmonic * 2 * np.pi / 9) % (2 * np.pi)
    return tesla_phase


def calculate_singularity_harmonic_states(
    harmonics=None,
    include_subharmonic=True
):
    """
    Calculate all harmonic states at the Singularity (t=0, base_phase=0.0).
    
    Mathematical Proof:
        At Singularity (base_phase = 0.0), all harmonics converge to phase 0.0:
        - Subharmonic (0.5x): phase = (0.0 × 0.5) mod 1.0 = 0.0
        - Fundamental (1x):   phase = (0.0 × 1.0) mod 1.0 = 0.0
        - 2x Harmonic:          phase = (0.0 × 2.0) mod 1.0 = 0.0
        - 3x Harmonic:         phase = (0.0 × 3.0) mod 1.0 = 0.0
        - ...all harmonics = 0.0 at Singularity
    
    The Singularity is a perfect quantum measurement point where all harmonic
    states are known simultaneously (phase = 0.0 for all harmonics).
    
    Args:
        harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
        include_subharmonic: If True, include subharmonic (0.5x) state
    
    Returns:
        dict: All harmonic states at Singularity with phases, frequencies, and coherence metrics
    """
    if harmonics is None:
        harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
    
    base_phase = 0.0  # Singularity: all phases converge to 0.0
    fundamental_frequency = 1.0  # Normalized fundamental
    
    harmonic_states = {}
    
    # Subharmonic state (0.5x)
    if include_subharmonic:
        subharmonic_phase = calculate_subharmonic_phase(base_phase)
        harmonic_states['subharmonic'] = {
            'multiplier': 0.5,
            'frequency': fundamental_frequency * 0.5,
            'phase': subharmonic_phase,  # Will be 0.0 at Singularity
            'phase_radians': subharmonic_phase * 2 * np.pi,
            'at_singularity': True  # Always 0.0 at Singularity
        }
    
    # Fundamental state (1x)
    fundamental_phase = base_phase  # 0.0 at Singularity
    harmonic_states['fundamental'] = {
        'multiplier': 1.0,
        'frequency': fundamental_frequency,
        'phase': fundamental_phase,  # 0.0 at Singularity
        'phase_radians': fundamental_phase * 2 * np.pi,
        'at_singularity': True
    }
    
    # Harmonic states (2x, 3x, 4x, etc.)
    for harmonic in harmonics:
        harmonic_phase = calculate_harmonic_phase(harmonic, base_phase)
        harmonic_states[f'harmonic_{harmonic}x'] = {
            'multiplier': float(harmonic),
            'frequency': fundamental_frequency * harmonic,
            'phase': harmonic_phase,  # Will be 0.0 at Singularity
            'phase_radians': harmonic_phase * 2 * np.pi,
            'at_singularity': True  # Always 0.0 at Singularity
        }
    
    # Calculate coherence metrics
    # At Singularity, all phases are 0.0, so coherence is perfect (1.0)
    all_phases = [state['phase'] for state in harmonic_states.values()]
    phase_coherence = 1.0 - np.std(all_phases)  # Perfect coherence (std = 0.0)
    
    # Calculate phase differences (all 0.0 at Singularity)
    phase_differences = {}
    harmonic_list = list(harmonic_states.keys())
    for i in range(len(harmonic_list)):
        for j in range(i + 1, len(harmonic_list)):
            key1, key2 = harmonic_list[i], harmonic_list[j]
            phase_diff = abs(harmonic_states[key1]['phase'] - harmonic_states[key2]['phase'])
            phase_differences[f'{key1}_vs_{key2}'] = phase_diff  # 0.0 at Singularity
    
    return {
        'singularity': True,
        'base_phase': base_phase,
        'harmonic_states': harmonic_states,
        'coherence_metrics': {
            'phase_coherence': phase_coherence,  # 1.0 (perfect) at Singularity
            'phase_std': np.std(all_phases),  # 0.0 at Singularity
            'all_phases_synchronized': True,  # All phases = 0.0
            'phase_differences': phase_differences  # All differences = 0.0
        },
        'quantum_measurement_point': True,  # Perfect measurement point
        'num_harmonics_tracked': len(harmonic_states),
        'timestamp': 0.0  # Singularity time
    }

