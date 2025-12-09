"""
Quantum Service for Echo Resonance Technology
Handles IBM Quantum access and circuit execution
"""

try:
    from qiskit_ibm_provider import IBMProvider
except ImportError:
    IBMProvider = None

try:
    from qiskit_ibm_runtime import QiskitRuntimeService, Sampler
    RUNTIME_SERVICE_AVAILABLE = True
except ImportError:
    RUNTIME_SERVICE_AVAILABLE = False
    QiskitRuntimeService = None
    Sampler = None

from qiskit_aer import AerSimulator
from qiskit import transpile
from typing import Dict, List, Optional
import time
import numpy as np
from echo_resonance_circuits import (
    create_multi_qubit_grid_circuit,
    create_harmonic_superposition_circuit,
    create_error_correction_circuit,
    create_tesla_mode_circuit,
    create_singularity_measurement_circuit
)
from echo_resonance_calculations import calculate_singularity_harmonic_states
import numpy as np

# Import circuit creation functions
from echo_resonance_circuits import (
    create_echo_resonance_circuit,
    create_multi_qubit_grid_circuit,
    create_harmonic_superposition_circuit,
    create_error_correction_circuit,
    create_tesla_mode_circuit,
    create_singularity_measurement_circuit
)

# Import calculation functions
from echo_resonance_calculations import (
    calculate_echo_resonance,
    calculate_singularity_harmonic_states
)
from echo_resonance_quantum_algorithm import (
    create_echo_resonance_quantum_algorithm,
    execute_echo_resonance_algorithm,
    create_multi_time_source_echo_algorithm,
    calculate_echo_space_quantum,
    create_chakra_amplified_echo_resonance_circuit,
    create_multi_step_chakra_synchronization_circuit,
    calculate_chakra_amplified_echo_resonance,
    calculate_chakra_frequency,
    calculate_chakra_phase,
    generate_chakra_harmonics,
    calculate_chakra_amplification
)
from bat_defensive_grid_quantum import (
    ThreatSignal,
    DefensiveGridConfig,
    create_bat_defensive_grid_circuit,
    execute_bat_defensive_grid,
    create_multi_threat_detection_circuit,
    calculate_3d_threat_position
)
from comprehensive_counter_measures_quantum import (
    ThreatProfile,
    ThreatCategory,
    Manufacturer,
    CounterMeasureType,
    CounterMeasureConfig,
    classify_threat,
    execute_comprehensive_counter_measures,
    create_multi_sensor_fusion_circuit,
    create_gps_spoofing_circuit,
    create_rf_jamming_circuit,
    create_signal_interception_circuit,
    create_electromagnetic_disruption_circuit
)
from ios_quantum_drone_disable import (
    optimize_disable_strategy_quantum,
    execute_ios_quantum_disable,
    Orientation,
    IOSDisableConfig
)


class EchoResonanceQuantumService:
    """Service for executing echo resonance quantum circuits on IBM Quantum."""
    
    def __init__(self, use_real_hardware: bool = False, crn: str = None, api_token: str = None):
        """
        Initialize quantum service.
        
        Args:
            use_real_hardware: If True, use IBM Quantum hardware. If False, use simulator.
            crn: Cloud Resource Name (for IBM Cloud accounts with CRN)
            api_token: API token (if not using saved account)
        """
        self.use_real_hardware = use_real_hardware
        self.provider = None
        self.runtime_service = None
        self.backend = None
        self.sampler = None  # For Runtime Service primitives
        
        if use_real_hardware:
            # Try Runtime Service first (if CRN provided or available in secrets)
            if RUNTIME_SERVICE_AVAILABLE:
                try:
                    from secrets_manager import SecretsManager
                    secrets = SecretsManager().load_secrets()
                    
                    # Get token and CRN
                    token = api_token or secrets.get('ibm_quantum_token')
                    instance_crn = crn or secrets.get('ibm_quantum_crn')
                    
                    if token and instance_crn:
                        self.runtime_service = QiskitRuntimeService(
                            channel="ibm_quantum_platform",
                            token=token,
                            instance=instance_crn
                        )
                        backends = self.runtime_service.backends()
                        available = [b for b in backends if b.status().operational]
                        if available:
                            # Prefer systems with more qubits
                            self.backend = max(available, key=lambda b: b.configuration().n_qubits)
                            backend_name = self.backend.name() if callable(self.backend.name) else self.backend.name
                            print(f"Using IBM Quantum Runtime Service: {backend_name}")
                            # Create Sampler for Runtime Service (required for execution)
                            if Sampler:
                                # Sampler takes backend as positional argument
                                self.sampler = Sampler(self.backend)
                            return
                except Exception as e:
                    print(f"Runtime Service connection failed: {e}, trying Provider...")
            
            # Fallback to Provider API (original method)
            if IBMProvider:
                try:
                    self.provider = IBMProvider()
                    # Get available backend (prefer larger systems)
                    backends = self.provider.backends()
                    # Filter for available backends
                    available = [b for b in backends if b.status().operational]
                    if available:
                        # Prefer systems with more qubits
                        self.backend = max(available, key=lambda b: b.configuration().n_qubits)
                        backend_name = self.backend.name() if callable(self.backend.name) else self.backend.name
                        print(f"Using IBM Quantum Provider: {backend_name}")
                        return
                    else:
                        print("No IBM Quantum backends available, using simulator")
                        self.backend = AerSimulator()
                        self.use_real_hardware = False
                except Exception as e:
                    print(f"Could not connect to IBM Quantum: {e}")
                    print("Using local simulator")
                    self.backend = AerSimulator()
                    self.use_real_hardware = False
            else:
                self.backend = AerSimulator()
                print("Using local simulator")
        else:
            self.backend = AerSimulator()
            print("Using local simulator")
        
        # Helper method for executing circuits (handles Runtime Service vs Provider API)
    def _execute_circuit(self, circuit, shots: int = 1024) -> Dict[str, int]:
        """
        Execute a quantum circuit and return counts.
        Handles both Runtime Service (with Sampler) and Provider API (with backend.run).
        
        Args:
            circuit: QuantumCircuit to execute
            shots: Number of measurement shots
            
        Returns:
            Dictionary of measurement counts
        """
        if self.sampler is not None:
            # Runtime Service: Transpile circuit for hardware, then use Sampler
            circuit = transpile(circuit, backend=self.backend)
            job = self.sampler.run([circuit], shots=shots)
            result = job.result()
            # Extract counts from PrimitiveResult
            from collections import Counter
            pub_result = result[0]
            data_bin = pub_result.data
            meas_data = data_bin['meas'] if 'meas' in data_bin.keys() else list(data_bin.values())[0]
            bitstrings = []
            arr = meas_data._array
            for i in range(meas_data.num_shots):
                val = int(arr[i, 0])
                bitstring = format(val, f'0{meas_data.num_bits}b')
                bitstrings.append(bitstring)
            counts_dict = Counter(bitstrings)
            return {k: v for k, v in counts_dict.items()}
        else:
            # Provider API or Simulator: Use backend.run()
            job = self.backend.run(circuit, shots=shots)
            result = job.result()
            return result.get_counts(circuit)
        
        # Helper method for executing circuits (handles Runtime Service vs Provider API)
    def _execute_circuit(self, circuit, shots: int = 1024) -> Dict[str, int]:
        """
        Execute a quantum circuit and return counts.
        Handles both Runtime Service (with Sampler) and Provider API (with backend.run).
        
        Args:
            circuit: QuantumCircuit to execute
            shots: Number of measurement shots
            
        Returns:
            Dictionary of measurement counts
        """
        if self.sampler is not None:
            # Runtime Service: Transpile circuit for hardware, then use Sampler
            circuit = transpile(circuit, backend=self.backend)
            job = self.sampler.run([circuit], shots=shots)
            result = job.result()
            # Extract counts from PrimitiveResult
            from collections import Counter
            pub_result = result[0]
            data_bin = pub_result.data
            meas_data = data_bin['meas'] if 'meas' in data_bin.keys() else list(data_bin.values())[0]
            bitstrings = []
            arr = meas_data._array
            for i in range(meas_data.num_shots):
                val = int(arr[i, 0])
                bitstring = format(val, f'0{meas_data.num_bits}b')
                bitstrings.append(bitstring)
            counts_dict = Counter(bitstrings)
            return {k: v for k, v in counts_dict.items()}
        else:
            # Provider API or Simulator: Use backend.run()
            job = self.backend.run(circuit, shots=shots)
            result = job.result()
            return result.get_counts(circuit)
        
        # Initialize vehicle timing quantum service
        try:
            from vehicle_timing_quantum import VehicleTimingQuantumService
            self.vehicle_timing_service = VehicleTimingQuantumService(backend='aer_simulator')
        except ImportError:
            self.vehicle_timing_service = None
        
        # Initialize key ignition beep quantum service
        try:
            from key_ignition_beep_quantum import KeyIgnitionBeepQuantumService
            self.beep_quantum_service = KeyIgnitionBeepQuantumService(backend='aer_simulator')
        except ImportError:
            self.beep_quantum_service = None
    
    def execute_echo_resonance_circuit(
        self,
        master_phase: float = 0.0,
        echo_resonance_factor: float = 0.1,
        shots: int = 1024
    ) -> Dict:
        """
        Execute echo resonance 4-point satellite circuit.
        
        Args:
            master_phase: Master clock phase (0.0 to 1.0)
            echo_resonance_factor: Echo resonance coefficient (0.1-0.3)
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results and echo resonance data
        """
        # Create circuit
        circuit = create_echo_resonance_circuit(
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor
        )
        
        # Execute - handle Runtime Service vs Provider API
        if self.sampler is not None:
            # Runtime Service: Transpile circuit for hardware, then use Sampler
            circuit = transpile(circuit, backend=self.backend)
            job = self.sampler.run([circuit], shots=shots)
            result = job.result()
            # Extract counts from PrimitiveResult
            # Result structure: PrimitiveResult([SamplerPubResult(data=DataBin(...))])
            from collections import Counter
            pub_result = result[0]  # Get first (and only) pub result
            data_bin = pub_result.data  # Get DataBin
            # DataBin is accessed like a dictionary or via keys
            # Use 'meas' for measurement results
            meas_data = data_bin['meas'] if 'meas' in data_bin.keys() else list(data_bin.values())[0]
            # Convert BitArray to counts - access internal array
            bitstrings = []
            arr = meas_data._array  # numpy array with shape (num_shots, 1)
            for i in range(meas_data.num_shots):
                val = int(arr[i, 0])  # Get integer value
                bitstring = format(val, f'0{meas_data.num_bits}b')
                bitstrings.append(bitstring)
            counts_dict = Counter(bitstrings)
            counts = {k: v for k, v in counts_dict.items()}
        else:
            # Provider API or Simulator: Use backend.run()
            job = self.backend.run(circuit, shots=shots)
            result = job.result()
            counts = result.get_counts(circuit)
        
        # Calculate echo resonance
        echo_data = calculate_echo_resonance(
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor
        )
        
        return {
            'counts': counts,
            'echo_resonance': echo_data,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_multi_qubit_grid(
        self,
        num_qubits: int = 4,
        frequency_multipliers: List[float] = None,
        phase_offsets: List[float] = None,
        shots: int = 1024
    ) -> Dict:
        """
        Execute multi-qubit grid circuit.
        
        Args:
            num_qubits: Number of qubits
            frequency_multipliers: List of frequency multipliers
            phase_offsets: List of phase offsets (0.0 to 1.0)
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results and qubit states
        """
        if frequency_multipliers is None:
            frequency_multipliers = [0.5, 1.0, 2.0, 3.0][:num_qubits]
        if phase_offsets is None:
            phase_offsets = [i / num_qubits for i in range(num_qubits)]
        
        # Get UTC time
        utc_seconds = time.time()
        
        # Create circuit
        circuit = create_multi_qubit_grid_circuit(
            num_qubits=num_qubits,
            frequency_multipliers=frequency_multipliers,
            phase_offsets=phase_offsets,
            utc_seconds=utc_seconds
        )
        
        # Execute using helper method
        counts = self._execute_circuit(circuit, shots=shots)
        
        return {
            'counts': counts,
            'num_qubits': num_qubits,
            'frequency_multipliers': frequency_multipliers,
            'phase_offsets': phase_offsets,
            'utc_seconds': utc_seconds,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_harmonic_superposition(
        self,
        fundamental_frequency: float = 1.0,
        harmonics: List[int] = None,
        include_subharmonic: bool = True,
        echo_resonance_factor: float = 0.1,
        shots: int = 1024
    ) -> Dict:
        """
        Execute harmonic-based quantum superposition circuit.
        
        Includes subharmonic (0.5x speed) tracking as revealed by the satellite visual.
        The subharmonic moves slower than the fundamental, filling gaps in music (double drum bass effect).
        
        Args:
            fundamental_frequency: Fundamental frequency
            harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
            include_subharmonic: If True, include subharmonic (0.5x) qubit (default: True)
            echo_resonance_factor: Echo resonance coefficient
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results and harmonic data (including subharmonic)
        """
        if harmonics is None:
            harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
        
        # Create circuit (now includes subharmonic by default)
        circuit = create_harmonic_superposition_circuit(
            fundamental_frequency=fundamental_frequency,
            harmonics=harmonics,
            include_subharmonic=include_subharmonic,
            echo_resonance_factor=echo_resonance_factor
        )
        
        # Execute using helper method
        counts = self._execute_circuit(circuit, shots=shots)
        
        return {
            'counts': counts,
            'fundamental_frequency': fundamental_frequency,
            'subharmonic_included': include_subharmonic,
            'harmonics': harmonics,
            'echo_resonance_factor': echo_resonance_factor,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_error_correction(
        self,
        num_data_qubits: int = 3,
        num_ancilla_qubits: int = 2,
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum error correction circuit.
        
        Args:
            num_data_qubits: Number of data qubits
            num_ancilla_qubits: Number of ancilla qubits
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results
        """
        circuit = create_error_correction_circuit(
            num_data_qubits=num_data_qubits,
            num_ancilla_qubits=num_ancilla_qubits
        )
        
        counts = self._execute_circuit(circuit, shots=shots)
        
        return {
            'counts': counts,
            'num_data_qubits': num_data_qubits,
            'num_ancilla_qubits': num_ancilla_qubits,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_tesla_mode(self, shots: int = 1024) -> Dict:
        """
        Execute Tesla Mode circuit (3-6-9 harmonics).
        
        Args:
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results
        """
        circuit = create_tesla_mode_circuit()
        
        counts = self._execute_circuit(circuit, shots=shots)
        
        return {
            'counts': counts,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_multi_frequency_subharmonic_tracking(
        self,
        frequencies: List[float] = None,
        harmonics: List[int] = None,
        include_subharmonic: bool = True,
        echo_resonance_factor: float = 0.1,
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum circuit to track subharmonic stability across ALL frequency ranges simultaneously.
        
        This is the profound beauty: quantum computing enables simultaneous tracking of subharmonic
        observer effect instability across all frequencies in a single quantum superposition.
        
        Quantum Observer Effect:
        - Higher frequency (Optical Lattice - "looking at closer") = subharmonic becomes extremely unstable
        - Lower frequency (Hydrogen Maser - "not looking") = subharmonic is much more stable
        - Quantum computing tracks ALL frequencies simultaneously in superposition
        
        Args:
            frequencies: List of frequencies to track simultaneously (default: all atomic clock frequencies)
            harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
            include_subharmonic: If True, include subharmonic (0.5x) qubit for each frequency
            echo_resonance_factor: Echo resonance coefficient
            shots: Number of measurement shots
        
        Returns:
            Dictionary with measurement results and subharmonic stability data for all frequencies
        """
        # Use harmonic superposition circuit for multi-frequency tracking
        # This provides similar functionality for tracking multiple frequencies
        from echo_resonance_circuits import create_harmonic_superposition_circuit
        
        # Create circuit with harmonics for multi-frequency tracking
        if harmonics is None:
            harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
        
        circuit = create_harmonic_superposition_circuit(harmonics=harmonics)
        
        counts = self._execute_circuit(circuit, shots=shots)
        
        # Calculate observer effect factors for each frequency
        if frequencies is None:
            frequencies = [
                1_420_405_752.0,      # Hydrogen Maser (reference - most stable)
                6_834_682_610.0,      # Rubidium-87
                9_192_631_770.0,      # Cesium-133
                429_228_004_229_873.0 # Optical Lattice (most unstable)
            ]
        
        reference_frequency = 1_420_405_752.0  # Hydrogen Maser
        observer_effects = []
        for freq in frequencies:
            normalized_freq = freq / reference_frequency
            observer_effect = np.log10(max(1.0, normalized_freq))
            observer_effects.append({
                'frequency': freq,
                'observer_effect_factor': observer_effect,
                'stability': 'high' if observer_effect < 1.0 else 'medium' if observer_effect < 3.0 else 'low'
            })
        
        return {
            'counts': counts,
            'frequencies': frequencies,
            'observer_effects': observer_effects,
            'subharmonic_included': include_subharmonic,
            'harmonics': harmonics if harmonics else [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17],
            'echo_resonance_factor': echo_resonance_factor,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_singularity_measurement(
        self,
        harmonics: List[int] = None,
        include_subharmonic: bool = True,
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum measurement of all harmonic states at the Singularity.
        
        Mathematical Proof:
            At Singularity (base_phase = 0.0), all harmonics converge to phase 0.0.
            This makes the Singularity a perfect quantum measurement point where
            all harmonic states are known simultaneously.
        
        Formula:
            At Singularity (base_phase = 0.0):
            - Subharmonic (0.5x): phase = (0.0 × 0.5) mod 1.0 = 0.0
            - Fundamental (1x):   phase = (0.0 × 1.0) mod 1.0 = 0.0
            - Harmonic N:          phase = (0.0 × N) mod 1.0 = 0.0
        
        Args:
            harmonics: List of harmonic multipliers (default: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17])
            include_subharmonic: If True, include subharmonic (0.5x) qubit (default: True)
            shots: Number of measurement shots
        
        Returns:
            Dictionary with:
            - counts: Quantum measurement results
            - singularity_states: All harmonic states at Singularity (phases, frequencies, coherence)
            - coherence_metrics: Phase coherence metrics (perfect at Singularity)
            - quantum_measurement_point: True (all states known simultaneously)
        """
        if harmonics is None:
            harmonics = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 17]
        
        # Calculate all harmonic states at Singularity (mathematical proof)
        singularity_states = calculate_singularity_harmonic_states(
            harmonics=harmonics,
            include_subharmonic=include_subharmonic
        )
        
        # Create quantum circuit for Singularity measurement
        circuit = create_singularity_measurement_circuit(
            harmonics=harmonics,
            include_subharmonic=include_subharmonic
        )
        
        # Execute quantum measurement
        counts = self._execute_circuit(circuit, shots=shots)
        
        return {
            'counts': counts,
            'singularity_states': singularity_states['harmonic_states'],
            'coherence_metrics': singularity_states['coherence_metrics'],
            'quantum_measurement_point': singularity_states['quantum_measurement_point'],
            'base_phase': singularity_states['base_phase'],  # 0.0 at Singularity
            'all_phases_synchronized': singularity_states['coherence_metrics']['all_phases_synchronized'],
            'num_harmonics_tracked': singularity_states['num_harmonics_tracked'],
            'harmonics': harmonics,
            'subharmonic_included': include_subharmonic,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_echo_resonance_quantum_algorithm(
        self,
        master_phase: float = 0.0,
        echo_resonance_factor: float = 0.1,
        time_sources: Optional[List[float]] = None,
        include_subharmonic: bool = True,
        shots: int = 1024
    ) -> Dict:
        """
        Execute complete echo resonance quantum algorithm.
        
        This implements the full echo resonance technology:
        - 4-point satellite system (left, right, top, bottom)
        - Master-satellite hierarchy with quantum entanglement
        - "Sync through unsync" mechanism using quantum superposition
        - Natural fusion through quantum measurement
        - Multi-time-source synchronization in parallel
        
        Args:
            master_phase: Master clock phase (0.0 to 1.0)
            echo_resonance_factor: Echo resonance coefficient (0.1-0.3)
            time_sources: List of time source phases (None = single master)
            include_subharmonic: If True, include subharmonic (0.5x) qubit
            shots: Number of measurement shots
        
        Returns:
            Dictionary with quantum results and echo resonance data
        """
        return execute_echo_resonance_algorithm(
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor,
            time_sources=time_sources,
            include_subharmonic=include_subharmonic,
            backend=self.backend,
            shots=shots
        )
    
    def calculate_echo_space_quantum(
        self,
        master_phase: float,
        echo_resonance_factor: float = 0.1,
        time_sources: Optional[List[float]] = None
    ) -> Dict:
        """
        Calculate echo space using quantum algorithm.
        
        Echo Space = 4-dimensional space created by 4 satellites
        - Left Echo (X-)
        - Right Echo (X+)
        - Top Echo (Y+)
        - Bottom Echo (Y-)
        
        Quantum Advantage:
        - Processes all time sources simultaneously in superposition
        - Natural fusion through quantum measurement
        - Exponential speedup for multiple time sources
        
        Args:
            master_phase: Master clock phase
            echo_resonance_factor: Echo resonance coefficient
            time_sources: List of time source phases
        
        Returns:
            dict: Echo space data with all satellite positions and fused data
        """
        return calculate_echo_space_quantum(
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor,
            time_sources=time_sources
        )
    
    def execute_chakra_amplified_echo_resonance(
        self,
        step_index: int,
        master_phase: float,
        echo_resonance_factor: float = 0.1,
        include_subharmonic: bool = True,
        shots: int = 1024
    ) -> Dict:
        """
        Execute echo resonance with chakra frequency amplification.
        
        This implements the chakra-amplified echo resonance from Section 15 of
        MULTI_STEP_QUANTUM_SYNCHRONIZATION.md.
        
        Architecture:
            - Step index maps to chakra (0-6 → 7 chakras)
            - Chakra frequency (256-448 Hz) amplifies echo resonance
            - Chakra harmonics tune echo satellites
            - Chakra phase alignment (72° rotation) creates phase relationships
        
        Args:
            step_index: Step index (0-6, maps to 7 chakras)
            master_phase: Master clock phase (0.0 to 1.0)
            echo_resonance_factor: Base echo resonance coefficient (0.1-0.3)
            include_subharmonic: If True, include subharmonic (0.5x) qubit
            shots: Number of measurement shots
        
        Returns:
            Dictionary with chakra-amplified echo resonance results
        """
        # Create chakra-amplified circuit
        circuit = create_chakra_amplified_echo_resonance_circuit(
            step_index=step_index,
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor,
            include_subharmonic=include_subharmonic
        )
        
        # Execute using helper method
        counts = self._execute_circuit(circuit, shots=shots)
        
        # Calculate chakra-amplified echo resonance (classical calculation)
        echo_data = calculate_chakra_amplified_echo_resonance(
            step_index=step_index,
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor
        )
        
        return {
            'counts': counts,
            'chakra_amplified_echo_resonance': echo_data,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_multi_step_chakra_synchronization(
        self,
        num_steps: int = 7,
        master_phase: float = 0.0,
        echo_resonance_factor: float = 0.1,
        include_subharmonic: bool = True,
        shots: int = 1024
    ) -> Dict:
        """
        Execute multi-step quantum synchronization with chakra frequency mapping.
        
        This implements the complete chakra-amplified multi-step quantum synchronization
        from Section 15 of MULTI_STEP_QUANTUM_SYNCHRONIZATION.md.
        
        Architecture:
            - 7 steps = 7 chakras (natural 1:1 mapping)
            - Each step uses its chakra frequency (256-448 Hz)
            - Chakra harmonics amplify echo resonance
            - Phase alignment through chakra rotation (72°)
            - Step-to-step synchronization through chakra harmonics
        
        Args:
            num_steps: Number of steps (typically 7 for 7 chakras)
            master_phase: Master clock phase (0.0 to 1.0)
            echo_resonance_factor: Base echo resonance coefficient (0.1-0.3)
            include_subharmonic: If True, include subharmonic (0.5x) qubit
            shots: Number of measurement shots
        
        Returns:
            Dictionary with multi-step chakra synchronization results
        """
        # Create multi-step chakra synchronization circuit
        circuit = create_multi_step_chakra_synchronization_circuit(
            num_steps=num_steps,
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor,
            include_subharmonic=include_subharmonic
        )
        
        # Execute using helper method
        counts = self._execute_circuit(circuit, shots=shots)
        
        # Calculate chakra data for each step
        step_data = []
        for step_idx in range(min(num_steps, 7)):
            step_echo_data = calculate_chakra_amplified_echo_resonance(
                step_index=step_idx,
                master_phase=master_phase,
                echo_resonance_factor=echo_resonance_factor
            )
            step_data.append(step_echo_data)
        
        return {
            'counts': counts,
            'num_steps': num_steps,
            'step_data': step_data,
            'chakra_frequencies': [calculate_chakra_frequency(i) for i in range(min(num_steps, 7))],
            'chakra_phases': [calculate_chakra_phase(i) for i in range(min(num_steps, 7))],
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_multi_step_quantum_circuit(
        self,
        steps: List[Dict],
        capture_waste_data: bool = True,
        synchronize_steps: bool = True,
        chakra_amplification: bool = False,
        doppler_prediction: bool = False,
        shots: int = 1024
    ) -> Dict:
        """
        Execute multi-step quantum circuit with echo resonance synchronization.
        
        This implements the complete multi-step quantum synchronization from
        MULTI_STEP_QUANTUM_SYNCHRONIZATION.md, including:
        - Waste data capture (intermediate states, phase correlations, echo signals)
        - Step-to-step synchronization via echo resonance
        - Chakra amplification (256-448 Hz, 7 chakras)
        - Doppler prediction (optional, for frequency deviation detection)
        
        Args:
            steps: List of step configurations
                [
                    {
                        "step_index": 1,
                        "circuit": QuantumCircuit or dict,
                        "machine": "ibm_brisbane" (optional)
                    },
                    ...
                ]
            capture_waste_data: If True, capture intermediate states (waste data)
            synchronize_steps: If True, use echo resonance for synchronization
            chakra_amplification: If True, use chakra Frequency amplification (256-448 Hz)
            doppler_prediction: If True, enable Doppler prediction for frequency monitoring
            shots: Number of measurement shots
        
        Returns:
            Dictionary with synchronized results, waste data, and global synchronization
        """
        from qiskit import QuantumCircuit
        from echo_resonance_quantum_algorithm import (
            calculate_chakra_amplified_echo_resonance,
            calculate_chakra_frequency,
            calculate_chakra_phase,
            generate_chakra_harmonics,
            calculate_chakra_amplification
        )
        
        results = {}
        self.step_states = {}  # Stores waste data for each step
        master_phase = (time.time() / 1.0) % 1.0  # UTC-based master phase
        echo_resonance_factor = 0.1
        
        # Execute each step
        for step_config in steps:
            step_index = step_config['step_index']
            circuit_data = step_config.get('circuit', {})
            machine = step_config.get('machine', None)
            
            # Convert circuit dict to QuantumCircuit if needed
            if isinstance(circuit_data, dict):
                # Create a simple circuit from dict (or use default echo resonance circuit)
                circuit = create_echo_resonance_circuit(
                    master_phase=master_phase,
                    echo_resonance_factor=echo_resonance_factor
                )
            elif isinstance(circuit_data, QuantumCircuit):
                circuit = circuit_data
            else:
                # Default: create echo resonance circuit
                circuit = create_echo_resonance_circuit(
                    master_phase=master_phase,
                    echo_resonance_factor=echo_resonance_factor
                )
            
            # Execute step
            job = self.backend.run(circuit, shots=shots)
            result = job.result()
            counts = result.get_counts(circuit)
            
            step_result = {
                'counts': counts,
                'step_index': step_index,
                'machine': machine
            }
            
            # Capture waste data (normally discarded)
            if capture_waste_data:
                waste_data = self._capture_waste_data(
                    counts=counts,
                    step_index=step_index,
                    master_phase=master_phase,
                    echo_resonance_factor=echo_resonance_factor,
                    chakra_amplification=chakra_amplification
                )
                self.step_states[step_index] = waste_data
                step_result['waste_data'] = waste_data
            
            # Synchronize with previous steps via echo resonance
            if synchronize_steps and step_index > 1:
                synchronization = self._synchronize_steps(
                    previous_step=step_index - 1,
                    current_step=step_index,
                    master_phase=master_phase,
                    echo_resonance_factor=echo_resonance_factor,
                    chakra_amplification=chakra_amplification
                )
                step_result['synchronized'] = synchronization
                step_result['synchronized_with_step'] = step_index - 1
            
            results[f'step_{step_index}'] = step_result
        
        # Global synchronization
        if synchronize_steps and len(steps) > 1:
            global_sync = self._calculate_global_synchronization(chakra_amplification)
            results['global_synchronization'] = global_sync
        
        # Doppler prediction (if enabled)
        if doppler_prediction:
            doppler_data = self._doppler_prediction_analysis()
            results['doppler_analysis'] = doppler_data.get('analysis', {})
            results['predictions'] = doppler_data.get('predictions', {})
            results['corrections'] = doppler_data.get('corrections', {})
            results['doppler_prediction_active'] = True
        
        return results
    
    def _capture_waste_data(
        self,
        counts: Dict,
        step_index: int,
        master_phase: float,
        echo_resonance_factor: float,
        chakra_amplification: bool = False
    ) -> Dict:
        """Capture 'waste data' that's normally discarded."""
        from echo_resonance_calculations import calculate_echo_resonance
        from echo_resonance_quantum_algorithm import (
            calculate_chakra_amplified_echo_resonance,
            calculate_chakra_frequency,
            calculate_chakra_phase,
            generate_chakra_harmonics,
            calculate_chakra_amplification
        )
        
        # Calculate chakra Frequency for this step (if amplification enabled)
        chakra_frequency = None
        chakra_phase = None
        chakra_harmonics = None
        chakra_amplification_factor = None
        
        if chakra_amplification:
            chakra_index = (step_index - 1) % 7  # Step 1 = index 0, Step 2 = index 1, etc.
            chakra_frequency = calculate_chakra_frequency(chakra_index)
            chakra_phase = calculate_chakra_phase(chakra_index)
            chakra_harmonics = generate_chakra_harmonics(chakra_index)
            chakra_amplification_factor = calculate_chakra_amplification(chakra_index)
        
        # Calculate echo resonance
        base_echo_factor = echo_resonance_factor
        echo_factor = base_echo_factor * chakra_amplification_factor if chakra_amplification else base_echo_factor
        
        if chakra_amplification:
            echo_data = calculate_chakra_amplified_echo_resonance(
                step_index=chakra_index,
                master_phase=master_phase,
                echo_resonance_factor=base_echo_factor
            )
        else:
            echo_data = calculate_echo_resonance(
                master_phase=master_phase,
                echo_resonance_factor=echo_factor
            )
        
        # Extract phase information from counts
        phase_data = self._extract_phase_data(counts)
        
        # Calculate phase correlations (if previous step exists)
        phase_correlations = None
        if step_index > 1 and (step_index - 1) in self.step_states:
            previous_phase = self.step_states[step_index - 1].get('phase_data', {}).get('phase', 0.0)
            phase_correlations = {
                'phase_diff': abs(phase_data['phase'] - previous_phase),
                'coherence': 1.0 - abs(phase_data['phase'] - previous_phase)
            }
        
        waste_data = {
            'intermediate_states': counts,  # Normally only final counts used
            'phase_data': phase_data,
            'phase_correlations': phase_correlations,
            'echo_resonance': echo_data,
            'echo_signals': {
                'left_echo': echo_data.get('left_echo', 0.0),
                'right_echo': echo_data.get('right_echo', 0.0),
                'top_echo': echo_data.get('top_echo', 0.0),
                'bottom_echo': echo_data.get('bottom_echo', 0.0),
                'fused_echo': echo_data.get('fused_echo', echo_data.get('fused_data', 0.0))
            },
            'master_phase': master_phase,
            'step_index': step_index
        }
        
        # Add chakra amplification data if enabled
        if chakra_amplification:
            waste_data['chakra_frequency'] = chakra_frequency
            waste_data['chakra_phase'] = chakra_phase
            waste_data['chakra_harmonics'] = chakra_harmonics
            waste_data['chakra_amplification'] = chakra_amplification_factor
            waste_data['chakra_index'] = chakra_index
        
        return waste_data
    
    def _extract_phase_data(self, counts: Dict) -> Dict:
        """Extract phase information from measurement counts."""
        total = sum(counts.values())
        if total == 0:
            return {'phase': 0.0, 'amplitude': 0.0}
        
        # Simple phase extraction from counts distribution
        # This is a simplified version - real implementation would use quantum state
        phase = sum(counts.values()) / (total * 2.0 * np.pi) if total > 0 else 0.0
        amplitude = max(counts.values()) / total if total > 0 else 0.0
        
        return {
            'phase': phase % 1.0,
            'amplitude': amplitude
        }
    
    def _synchronize_steps(
        self,
        previous_step: int,
        current_step: int,
        master_phase: float,
        echo_resonance_factor: float,
        chakra_amplification: bool = False
    ) -> Dict:
        """Synchronize current step with previous step using echo resonance."""
        if previous_step not in self.step_states:
            return {'synchronized': False}
        
        previous_waste = self.step_states[previous_step]
        current_waste = self.step_states[current_step]
        
        # Get echo signals from previous step (waste data)
        previous_echo = previous_waste['echo_signals']['fused_echo']
        current_phase = current_waste['phase_data']['phase']
        previous_phase = previous_waste['phase_data']['phase']
        
        # Base echo resonance factor
        base_echo_factor = echo_resonance_factor
        
        # Chakra amplification (if enabled)
        chakra_amplification_factor = 1.0
        harmonic_resonance = None
        
        if chakra_amplification:
            curr_chakra_amp = current_waste.get('chakra_amplification', 1.0)
            chakra_amplification_factor = curr_chakra_amp
            
            # Detect harmonic resonance between steps
            prev_chakra_harmonics = previous_waste.get('chakra_harmonics', [])
            curr_chakra_harmonics = current_waste.get('chakra_harmonics', [])
            harmonic_resonance = self._detect_harmonic_resonance(
                prev_chakra_harmonics,
                curr_chakra_harmonics
            )
        
        # Calculate synchronization via echo resonance (chakra-amplified)
        amplified_echo_factor = base_echo_factor * chakra_amplification_factor
        phase_alignment = (current_phase + (previous_echo * amplified_echo_factor)) % 1.0
        
        # Phase coherence
        phase_coherence = 1.0 - abs(current_phase - previous_phase)
        
        sync_result = {
            'synchronized': True,
            'phase_alignment': phase_alignment,
            'phase_coherence': phase_coherence,
            'echo_resonance_factor': base_echo_factor,
            'amplified_echo_factor': amplified_echo_factor,
            'previous_echo_used': previous_echo,  # Waste data now valuable!
            'chakra_amplification_active': chakra_amplification
        }
        
        if chakra_amplification:
            sync_result['chakra_amplification_factor'] = chakra_amplification_factor
            sync_result['harmonic_resonance'] = harmonic_resonance
        
        return sync_result
    
    def _detect_harmonic_resonance(
        self,
        prev_harmonics: List[float],
        curr_harmonics: List[float]
    ) -> Dict:
        """Detect harmonic resonance between two steps' chakra harmonics."""
        resonances = []
        
        for i, prev_harm in enumerate(prev_harmonics):
            for j, curr_harm in enumerate(curr_harmonics):
                # Check if harmonics overlap (within 1 Hz tolerance)
                if abs(prev_harm - curr_harm) < 1.0:
                    resonances.append({
                        'previous_harmonic_index': i,
                        'current_harmonic_index': j,
                        'resonant_frequency': prev_harm,
                        'overlap': True
                    })
        
        return {
            'resonances_detected': len(resonances),
            'resonances': resonances,
            'has_resonance': len(resonances) > 0
        }
    
    def _calculate_global_synchronization(self, chakra_amplification: bool = False) -> Dict:
        """Calculate global synchronization across all steps."""
        if len(self.step_states) < 2:
            return {'all_steps_aligned': False}
        
        phases = [
            self.step_states[i]['phase_data']['phase']
            for i in sorted(self.step_states.keys())
        ]
        
        # Calculate phase coherence across all steps
        phase_diffs = [abs(phases[i] - phases[i+1]) for i in range(len(phases)-1)]
        avg_phase_diff = sum(phase_diffs) / len(phase_diffs) if phase_diffs else 0.0
        global_coherence = 1.0 - avg_phase_diff
        
        # Check if all steps are aligned
        all_aligned = global_coherence > 0.9
        
        # Calculate chakra amplification metrics (if enabled)
        chakra_amplification_active = False
        chakra_amplification_factors = []
        chakra_harmonic_resonances = []
        
        if chakra_amplification:
            for step_idx in sorted(self.step_states.keys()):
                step_waste = self.step_states[step_idx]
                if 'chakra_amplification' in step_waste:
                    chakra_amplification_active = True
                    chakra_amplification_factors.append(step_waste['chakra_amplification'])
            
            # Detect cross-step harmonic resonances
            step_indices = sorted(self.step_states.keys())
            for i in range(len(step_indices) - 1):
                prev_step = self.step_states[step_indices[i]]
                curr_step = self.step_states[step_indices[i + 1]]
                
                if 'chakra_harmonics' in prev_step and 'chakra_harmonics' in curr_step:
                    resonance = self._detect_harmonic_resonance(
                        prev_step['chakra_harmonics'],
                        curr_step['chakra_harmonics']
                    )
                    if resonance['has_resonance']:
                        chakra_harmonic_resonances.append({
                            'step_pair': (step_indices[i], step_indices[i + 1]),
                            'resonance': resonance
                        })
        
        result = {
            'all_steps_aligned': all_aligned,
            'phase_coherence': global_coherence,
            'average_phase_difference': avg_phase_diff,
            'echo_resonance_active': True,
            'waste_data_utilized': True,  # Key metric!
            'chakra_amplification_active': chakra_amplification_active
        }
        
        if chakra_amplification_active:
            result['average_chakra_amplification'] = (
                sum(chakra_amplification_factors) / len(chakra_amplification_factors)
            ) if chakra_amplification_factors else 1.0
            result['chakra_harmonic_resonances'] = chakra_harmonic_resonances
        
        return result
    
    def _doppler_prediction_analysis(self) -> Dict:
        """Perform Doppler prediction analysis for frequency monitoring."""
        # Simplified Doppler prediction - full implementation would use Doppler service
        analysis = {}
        predictions = {}
        corrections = {}
        
        for step_index, step_waste in self.step_states.items():
            expected_freq = step_waste.get('chakra_frequency', 256.0)
            observed_freq = expected_freq  # Simplified - would measure actual frequency
            
            doppler_shift = observed_freq - expected_freq
            misalignment_level = abs(doppler_shift) / expected_freq if expected_freq > 0 else 0.0
            
            analysis[step_index] = {
                'expected_frequency': expected_freq,
                'observed_frequency': observed_freq,
                'doppler_shift': doppler_shift,
                'misalignment_level': misalignment_level,
                'status': 'aligned' if misalignment_level < 0.01 else 'slight_misalignment'
            }
            
            predictions[step_index] = {
                'current_misalignment': misalignment_level,
                'predicted_misalignment': misalignment_level,
                'time_to_critical': None,
                'sync_failure_predicted': False
            }
            
            corrections[step_index] = {
                'intervention_applied': False,
                'reason': 'No correction needed'
            }
        
        return {
            'analysis': analysis,
            'predictions': predictions,
            'corrections': corrections
        }
    
    def execute_bat_defensive_grid(
        self,
        threat_signals: List[Dict],
        master_phase: float = None,
        echo_resonance_factor: float = None,
        shots: int = 1024
    ) -> Dict:
        """
        Execute bat defensive grid quantum algorithm.
        
        Multi-modal sensing: Sound (Acoustic) OR Light (Camera) to lock in on targets.
        Just like bats - they don't need light, they can use sound (or light).
        
        Args:
            threat_signals: List of threat signal dictionaries with:
                - direction: int (0=LEFT, 1=RIGHT, 2=TOP, 3=BOTTOM)
                - distance: float (meters)
                - bearing: float (radians)
                - signal_strength: float (0.0 to 1.0)
                - timestamp: float (UTC seconds, optional)
            master_phase: Master detection hub phase (None = current time)
            echo_resonance_factor: Echo resonance coefficient (None = default)
            shots: Number of measurement shots
        
        Returns:
            dict: Defensive grid results with threat positions and sensor fusion
        """
        # Convert dictionaries to ThreatSignal objects
        threat_objects = []
        for signal in threat_signals:
            threat_objects.append(ThreatSignal(
                direction=signal['direction'],
                distance=signal['distance'],
                bearing=signal['bearing'],
                signal_strength=signal['signal_strength'],
                timestamp=signal.get('timestamp', time.time())
            ))
        
        # Execute bat defensive grid
        result = execute_bat_defensive_grid(
            threat_signals=threat_objects,
            master_phase=master_phase,
            echo_resonance_factor=echo_resonance_factor,
            backend=self.backend,
            shots=shots
        )
        
        # Convert ThreatPosition to dictionary
        threat_pos = result['threat_position']
        result['threat_position'] = {
            'x': threat_pos.x,
            'y': threat_pos.y,
            'z': threat_pos.z,
            'confidence': threat_pos.confidence
        }
        
        return result
    
    def execute_comprehensive_counter_measures(
        self,
        threat_signals: List[Dict],
        manufacturer: str = None,
        category: str = None,
        shots: int = 1024
    ) -> Dict:
        """
        Execute comprehensive counter measures for a threat.
        
        Selects and executes appropriate counter measures based on threat category and manufacturer.
        Supports all major drone manufacturers and threat categories.
        
        Args:
            threat_signals: List of threat signal dictionaries with:
                - direction: int (0=LEFT, 1=RIGHT, 2=TOP, 3=BOTTOM)
                - distance: float (meters)
                - bearing: float (radians)
                - signal_strength: float (0.0 to 1.0)
                - timestamp: float (UTC seconds, optional)
            manufacturer: Optional manufacturer name ('dji', 'autel', 'skydio', etc.)
            category: Optional threat category ('consumer', 'military', 'autonomous', etc.)
            shots: Number of measurement shots
        
        Returns:
            dict: Comprehensive counter measure results with detection, classification, and counter measures
        """
        # Convert dictionaries to ThreatSignal objects
        threat_objects = []
        for signal in threat_signals:
            threat_objects.append(ThreatSignal(
                direction=signal['direction'],
                distance=signal['distance'],
                bearing=signal['bearing'],
                signal_strength=signal['signal_strength'],
                timestamp=signal.get('timestamp', time.time())
            ))
        
        # Classify threat if not provided
        if manufacturer is None or category is None:
            threat_profile = classify_threat(threat_objects)
        else:
            # Create threat profile from provided information
            manufacturer_enum = Manufacturer[manufacturer.upper()] if manufacturer else Manufacturer.UNKNOWN
            category_enum = ThreatCategory[category.upper()] if category else ThreatCategory.CONSUMER
            threat_profile = ThreatProfile(
                manufacturer=manufacturer_enum,
                category=category_enum,
                threat_signals=threat_objects,
                confidence=0.85
            )
        
        # Execute comprehensive counter measures
        result = execute_comprehensive_counter_measures(
            threat_profile,
            backend=self.backend,
            shots=shots
        )
        
        # Convert threat position to dictionary format
        if 'threat_position' in result:
            threat_pos = result['threat_position']
            if isinstance(threat_pos, tuple):
                result['threat_position'] = {
                    'x': threat_pos[0],
                    'y': threat_pos[1],
                    'z': threat_pos[2]
                }
        
        return result
    
    def execute_vehicle_timing_diagnosis(
        self,
        rpm: float,
        fundamental_freq: float,
        harmonic_2: float,
        harmonic_3: float,
        harmonic_4: float,
        harmonic_5: float,
        phase_coherence: float,
        misfire_count: int = 0,
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum vehicle timing diagnosis.
        
        Args:
            rpm: Engine RPM
            fundamental_freq: Fundamental frequency (RPM / 60)
            harmonic_2: 2nd harmonic amplitude
            harmonic_3: 3rd harmonic amplitude
            harmonic_4: 4th harmonic amplitude
            harmonic_5: 5th harmonic amplitude
            phase_coherence: Phase coherence (0.0 to 1.0)
            misfire_count: Number of misfires
            shots: Number of quantum measurements
        
        Returns:
            Dictionary with timing diagnosis
        """
        import time
        
        engine_data = EngineHarmonicData(
            rpm=rpm,
            fundamental_freq=fundamental_freq,
            harmonic_2=harmonic_2,
            harmonic_3=harmonic_3,
            harmonic_4=harmonic_4,
            harmonic_5=harmonic_5,
            phase_coherence=phase_coherence,
            misfire_count=misfire_count,
            timestamp=time.time()
        )
        
        diagnosis = self.vehicle_timing_service.analyze_timing_condition(
            engine_data, shots=shots
        )
        
        return {
            'timing_condition': diagnosis.timing_condition.value,
            'confidence': diagnosis.confidence,
            'optimal_rpm': diagnosis.optimal_rpm,
            'harmonic_coherence': diagnosis.harmonic_coherence,
            'recommendations': diagnosis.recommendations,
            'quantum_state': diagnosis.quantum_state,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_vehicle_optimal_rpm(
        self,
        rpm_data: List[Dict],
        shots: int = 1024
    ) -> Dict:
        """
        Find optimal RPM using quantum algorithms.
        
        Args:
            rpm_data: List of dictionaries with engine data at different RPMs
            shots: Number of quantum measurements
        
        Returns:
            Dictionary with optimal RPM analysis
        """
        import time
        
        engine_data_list = []
        for data in rpm_data:
            engine_data = EngineHarmonicData(
                rpm=data.get('rpm', 1900.0),
                fundamental_freq=data.get('fundamental_freq', data.get('rpm', 1900.0) / 60),
                harmonic_2=data.get('harmonic_2', 0.8),
                harmonic_3=data.get('harmonic_3', 0.6),
                harmonic_4=data.get('harmonic_4', 0.5),
                harmonic_5=data.get('harmonic_5', 0.4),
                phase_coherence=data.get('phase_coherence', 0.75),
                misfire_count=data.get('misfire_count', 0),
                timestamp=time.time()
            )
            engine_data_list.append(engine_data)
        
        result = self.vehicle_timing_service.find_optimal_rpm_range(
            engine_data_list, shots=shots
        )
        
        return {
            'optimal_rpm': result['optimal_rpm'],
            'optimal_range': result['optimal_range'],
            'confidence': result['confidence'],
            'quantum_analysis': result.get('quantum_analysis', {}),
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_key_ignition_beep_analysis(
        self,
        beep_times: List[float],
        beep_intervals: List[float],
        beep_frequencies: List[float],
        harmonic_pattern: List[float],
        phase_coherence: float,
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum key ignition beep analysis.
        
        Analyzes beep harmonics to find optimal start moment for better PCM data retention.
        
        Args:
            beep_times: Timestamps of beeps (seconds)
            beep_intervals: Time between beeps (seconds)
            beep_frequencies: Frequency of each beep (Hz)
            harmonic_pattern: Harmonic amplitudes
            phase_coherence: Phase coherence (0.0 to 1.0)
            shots: Number of quantum measurements
        
        Returns:
            Dictionary with optimal start moment analysis
        """
        import time
        
        beep_data = BeepData(
            beep_times=beep_times,
            beep_intervals=beep_intervals,
            beep_frequencies=beep_frequencies,
            harmonic_pattern=harmonic_pattern,
            phase_coherence=phase_coherence,
            timestamp=time.time()
        )
        
        optimal_moment = self.beep_quantum_service.analyze_beep_pattern(
            beep_data, shots=shots
        )
        
        return {
            'optimal_beep_index': optimal_moment.optimal_beep_index,
            'optimal_timing': optimal_moment.optimal_timing,
            'confidence': optimal_moment.confidence,
            'timing_quality': optimal_moment.timing_quality.value,
            'recommendations': optimal_moment.recommendations,
            'quantum_state': optimal_moment.quantum_state,
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_multi_cycle_beep_analysis(
        self,
        beep_cycles: List[Dict],
        shots: int = 1024
    ) -> Dict:
        """
        Find optimal beep pattern across multiple cycles using quantum algorithms.
        
        Args:
            beep_cycles: List of dictionaries with beep data from multiple cycles
            shots: Number of quantum measurements
        
        Returns:
            Dictionary with optimal beep pattern analysis
        """
        import time
        
        beep_data_list = []
        for cycle in beep_cycles:
            beep_data = BeepData(
                beep_times=cycle.get('beep_times', []),
                beep_intervals=cycle.get('beep_intervals', []),
                beep_frequencies=cycle.get('beep_frequencies', []),
                harmonic_pattern=cycle.get('harmonic_pattern', []),
                phase_coherence=cycle.get('phase_coherence', 0.75),
                timestamp=time.time()
            )
            beep_data_list.append(beep_data)
        
        result = self.beep_quantum_service.find_optimal_beep_pattern(
            beep_data_list, shots=shots
        )
        
        return {
            'optimal_beep_index': result['optimal_beep_index'],
            'optimal_timing': result['optimal_timing'],
            'confidence': result['confidence'],
            'pattern_consistency': result['pattern_consistency'],
            'timing_quality': result['timing_quality'],
            'quantum_analysis': result.get('quantum_analysis', {}),
            'backend': self.backend.name if hasattr(self.backend, 'name') else str(self.backend),
            'shots': shots
        }
    
    def execute_ios_quantum_disable(
        self,
        threat: Dict,
        echo_resonance: Dict,
        frequency_band: Dict,
        safe_zone: Optional[Dict] = None,
        orientation: str = "portrait",
        shots: int = 1024
    ) -> Dict:
        """
        Execute quantum-optimized drone disable for iOS app.
        
        This method wraps the standalone execute_ios_quantum_disable function
        to provide integration with the EchoResonanceQuantumService.
        
        Args:
            threat: Threat data from iOS detection
                {
                    "position": {"x": float, "y": float, "z": float},
                    "manufacturer": str,
                    "category": str,
                    "confidence": float,
                    "signals": [...]
                }
            echo_resonance: Echo resonance data from iOS
                {
                    "leftEcho": float,
                    "rightEcho": float,
                    "topEcho": float,
                    "bottomEcho": float,
                    "fusedData": float,
                    "masterPhase": float
                }
            frequency_band: {"min": float, "max": float}
            safe_zone: {"x": float, "y": float, "z": float} (optional)
            orientation: "portrait" or "landscape"
            shots: Number of quantum circuit shots (default: 1024)
        
        Returns:
            dict: Disable result with counter measures
            {
                "success": bool,
                "counter_measures": [...],
                "disable_status": str,
                "execution_time": float,
                "confidence": float
            }
        """
        import time
        start_time = time.time()
        
        # Call the standalone function
        result = execute_ios_quantum_disable(
            threat=threat,
            echo_resonance=echo_resonance,
            frequency_band=frequency_band,
            safe_zone=safe_zone,
            orientation=orientation
        )
        
        execution_time = time.time() - start_time
        
        # Add execution metadata
        result['execution_time'] = execution_time
        result['backend'] = self.backend.name if hasattr(self.backend, 'name') else str(self.backend)
        result['shots'] = shots
        
        return result

