#!/usr/bin/env python3
"""
Test First Circuit on IBM Quantum Hardware
Runs a simple echo resonance circuit on real IBM Quantum hardware
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from quantum_service import EchoResonanceQuantumService

def main():
    print("=" * 70)
    print("FIRST CIRCUIT ON IBM QUANTUM HARDWARE")
    print("=" * 70)
    print()
    
    print("Creating quantum service with real hardware...")
    service = EchoResonanceQuantumService(use_real_hardware=True)
    
    print(f"Backend: {service.backend}")
    print(f"Using real hardware: {service.use_real_hardware}")
    print()
    
    if not service.use_real_hardware:
        print("⚠️  Not using real hardware. Check connection.")
        return False
    
    print("Executing echo resonance circuit...")
    print("(This may take 30-60 seconds on real hardware)")
    print()
    
    try:
        result = service.execute_echo_resonance_circuit(
            master_phase=0.5,
            echo_resonance_factor=0.1,
            shots=256  # Start with fewer shots to save credits
        )
        
        print("=" * 70)
        print("✅ CIRCUIT EXECUTED SUCCESSFULLY!")
        print("=" * 70)
        print()
        print(f"Backend: {result['backend']}")
        print(f"Shots: {result['shots']}")
        print()
        print("Measurement Results:")
        for state, count in sorted(result['counts'].items(), key=lambda x: x[1], reverse=True)[:5]:
            percentage = (count / result['shots']) * 100
            print(f"  {state}: {count} ({percentage:.1f}%)")
        print()
        print("Echo Resonance Data:")
        echo = result['echo_resonance']
        print(f"  Master Phase: {echo.get('master_phase', 'N/A'):.4f}")
        print(f"  Left Echo: {echo.get('left_echo', 'N/A'):.4f}")
        print(f"  Right Echo: {echo.get('right_echo', 'N/A'):.4f}")
        print()
        print("=" * 70)
        print("🎉 SUCCESS! Your first circuit ran on IBM Quantum hardware!")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"❌ Error executing circuit: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

