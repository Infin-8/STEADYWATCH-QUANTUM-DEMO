#!/usr/bin/env python3
"""
Bell Inequality Test Demo
Demonstrates Bell inequality violation on GHZ states with quantum randomness and error mitigation

This demo:
1. Creates a 3-qubit GHZ state
2. Tests Mermin inequality with quantum random number generation
3. Applies error mitigation to improve fidelity
4. Detects Bell inequality violations

Usage:
    python3 examples/bell_inequality_demo.py

Requirements:
    - IBM Quantum account (for hardware execution)
    - Or will use simulator if hardware not available
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.mermin_inequality_tests import MerminInequalityTester

# Optional IBM Runtime import
try:
    from qiskit_ibm_runtime import QiskitRuntimeService
    from secrets_manager import SecretsManager
    IBM_RUNTIME_AVAILABLE = True
except ImportError:
    IBM_RUNTIME_AVAILABLE = False
    print("⚠️  qiskit_ibm_runtime not available. Will use simulator.")


def main():
    """Run Bell inequality test demo"""
    
    print("=" * 80)
    print("BELL INEQUALITY TEST DEMO")
    print("Quantum Randomness + Error Mitigation")
    print("=" * 80)
    print()
    
    # Configuration
    BACKEND_NAME = "ibm_fez"
    NUM_QUBITS = 3
    SHOTS = 10000
    USE_MITIGATION = True
    
    # Initialize IBM Quantum service (if available)
    service = None
    if IBM_RUNTIME_AVAILABLE:
        try:
            secrets = SecretsManager().load_secrets()
            token = secrets.get('ibm_quantum_token')
            crn = secrets.get('ibm_quantum_crn')
            
            if token and crn:
                service = QiskitRuntimeService(
                    channel="ibm_quantum_platform", 
                    token=token, 
                    instance=crn
                )
                print(f"✅ Connected to IBM Quantum")
            else:
                print("⚠️  IBM Quantum credentials not found. Using simulator.")
        except Exception as e:
            print(f"⚠️  Could not connect to IBM Quantum: {e}")
            print("   Using simulator mode")
    else:
        print("⚠️  IBM Quantum Runtime not available. Using simulator.")
    
    # Initialize tester
    tester = MerminInequalityTester(
        backend_name=BACKEND_NAME,
        num_qubits=NUM_QUBITS,
        service=service
    )
    
    print()
    print("Configuration:")
    print(f"  Backend: {BACKEND_NAME}")
    print(f"  Qubit Count: {NUM_QUBITS}")
    print(f"  Shots: {SHOTS:,}")
    print(f"  Error Mitigation: {'Enabled' if USE_MITIGATION else 'Disabled'}")
    print()
    print("=" * 80)
    print()
    
    # Run test
    results = tester.test_mermin_inequality(
        shots=SHOTS,
        use_mitigation=USE_MITIGATION,
        randomization_mode="per_batch"
    )
    
    # Save results
    output_dir = Path(__file__).parent.parent / "bell_inequality_data"
    output_dir.mkdir(exist_ok=True)
    
    timestamp = results['timestamp'].replace(':', '-').split('.')[0]
    output_file = output_dir / f"bell_inequality_demo_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print()
    print(f"💾 Results saved to: {output_file}")
    print()
    print("=" * 80)
    print("✅ DEMO COMPLETE")
    print("=" * 80)
    
    # Summary
    print()
    print("SUMMARY:")
    print(f"  Raw Mermin Parameter: |M| = {abs(results['raw_m']):.4f}")
    if USE_MITIGATION:
        print(f"  Mitigated Mermin Parameter: |M| = {abs(results['mitigated_m']):.4f}")
        print(f"  Violation: {results['mitigated_violation']:+.4f}")
        if results['mitigated_violation'] > 0:
            print("  ✅ BELL INEQUALITY VIOLATION DETECTED!")
            print("     Quantum nonlocality CONFIRMED!")
    print()
    print("For more information, see:")
    print("  - docs/research/BELL_INEQUALITY_BREAKTHROUGH.md")
    print("  - docs/research/FREEDOM_OF_CHOICE_LOOPHOLE_CLOSED.md")
    print("  - docs/research/MERMIN_INEQUALITY_ANALYSIS.md")


if __name__ == "__main__":
    main()

