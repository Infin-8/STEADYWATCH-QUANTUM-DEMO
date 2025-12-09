#!/usr/bin/env python3
"""
Test Multiple Quantum Circuits on IBM Quantum Hardware

This script runs several different quantum circuits to validate
the IBM Quantum integration across different circuit types.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from quantum_service import EchoResonanceQuantumService


def main():
    """Run multiple circuit tests"""
    print("=" * 70)
    print("MULTIPLE CIRCUIT TESTS ON IBM QUANTUM HARDWARE")
    print("=" * 70)
    print()
    
    # Initialize service
    print("🔬 Creating quantum service with real hardware...")
    service = EchoResonanceQuantumService(use_real_hardware=True)
    print(f"Backend: {service.backend}")
    print(f"Using real hardware: {service.use_real_hardware}")
    print()
    
    if not service.use_real_hardware:
        print("⚠️  Not using real hardware - tests will run on simulator")
        print()
    
    # Test 1: Echo Resonance Circuit
    print("=" * 70)
    print("TEST 1: Echo Resonance Circuit")
    print("=" * 70)
    print("Executing echo resonance circuit...")
    print("(This may take 30-60 seconds on real hardware)")
    print()
    
    try:
        result = service.execute_echo_resonance_circuit(
            master_phase=0.25,
            echo_resonance_factor=0.15,
            shots=128
        )
        
        print("✅ Echo Resonance Circuit Executed!")
        print(f"   Backend: {result['backend']}")
        print(f"   Shots: {result['shots']}")
        print(f"   Top 3 Results:")
        sorted_counts = sorted(result['counts'].items(), key=lambda x: x[1], reverse=True)
        for bitstring, count in sorted_counts[:3]:
            percentage = (count / result['shots']) * 100
            print(f"     {bitstring}: {count} ({percentage:.1f}%)")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
    
    # Test 2: Multi-Qubit Grid Circuit
    print("=" * 70)
    print("TEST 2: Multi-Qubit Grid Circuit")
    print("=" * 70)
    print("Executing multi-qubit grid circuit...")
    print("(This may take 30-60 seconds on real hardware)")
    print()
    
    try:
        result = service.execute_multi_qubit_grid(
            num_qubits=3,
            shots=128
        )
        
        print("✅ Multi-Qubit Grid Circuit Executed!")
        print(f"   Backend: {result['backend']}")
        print(f"   Shots: {result['shots']}")
        print(f"   Top 3 Results:")
        sorted_counts = sorted(result['counts'].items(), key=lambda x: x[1], reverse=True)
        for bitstring, count in sorted_counts[:3]:
            percentage = (count / result['shots']) * 100
            print(f"     {bitstring}: {count} ({percentage:.1f}%)")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
    
    # Test 3: Harmonic Superposition Circuit
    print("=" * 70)
    print("TEST 3: Harmonic Superposition Circuit")
    print("=" * 70)
    print("Executing harmonic superposition circuit...")
    print("(This may take 30-60 seconds on real hardware)")
    print()
    
    try:
        result = service.execute_harmonic_superposition(
            fundamental_frequency=1.0,
            harmonics=[2.0, 3.0],
            shots=128
        )
        
        print("✅ Harmonic Superposition Circuit Executed!")
        print(f"   Backend: {result['backend']}")
        print(f"   Shots: {result['shots']}")
        print(f"   Top 3 Results:")
        sorted_counts = sorted(result['counts'].items(), key=lambda x: x[1], reverse=True)
        for bitstring, count in sorted_counts[:3]:
            percentage = (count / result['shots']) * 100
            print(f"     {bitstring}: {count} ({percentage:.1f}%)")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
    
    print("=" * 70)
    print("✅ ALL CIRCUIT TESTS COMPLETE!")
    print("=" * 70)


if __name__ == '__main__':
    main()

