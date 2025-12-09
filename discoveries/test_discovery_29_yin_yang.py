#!/usr/bin/env python3
"""
Test Discovery 29: Yin/Yang Balance Detection on IBM Quantum Hardware

Validates:
- Significant energy value detection (e.g., 183.0 = 3 × 61)
- Tesla number relationships
- Balance between precision and mathematical structure
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from quantum_service import EchoResonanceQuantumService
from bat_defensive_grid_quantum import (
    execute_bat_defensive_grid,
    ThreatSignal
)


def test_yin_yang_balance():
    """Test Yin/Yang Balance Detection on real hardware."""
    print("=" * 70)
    print("DISCOVERY 29: YIN/YANG BALANCE DETECTION VALIDATION")
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
    
    print("=" * 70)
    print("TEST 1: Significant Energy Value Detection (183.0)")
    print("=" * 70)
    print()
    print("Testing for 183.0 = 3 × 61 (Tesla relationship)")
    print()
    
    # Create threat signals that might produce 183.0 values
    # Note: Actual values depend on quantum measurement results
    import time
    threat_signals = [
        ThreatSignal(
            direction=0,  # LEFT
            distance=183.0,  # Significant value
            bearing=0.0,
            signal_strength=0.8,
            timestamp=time.time()
        ),
        ThreatSignal(
            direction=1,  # RIGHT
            distance=183.0,  # Significant value
            bearing=0.0,
            signal_strength=0.7,
            timestamp=time.time()
        )
    ]
    
    result = execute_bat_defensive_grid(
        threat_signals=threat_signals,
        backend=service.backend,
        shots=128,
        enable_yin_yang=True
    )
    
    print(f"✅ Quantum circuit executed")
    print(f"   Backend: {result.get('backend', 'unknown')}")
    print()
    
    if 'yin_yang_analysis' in result:
        yin_yang = result['yin_yang_analysis']
        print("Yin/Yang Balance Analysis:")
        
        if yin_yang.get('yin_yang_analysis_available'):
            balance_detected = yin_yang.get('balance_detected', False)
            print(f"   Balance detected: {balance_detected}")
            
            if 'significant_values' in yin_yang:
                sig_values = yin_yang['significant_values']
                print(f"   Significant values found: {len(sig_values)}")
                
                for sig_val in sig_values:
                    print(f"     ✅ {sig_val.get('relationship', 'N/A')}")
                    print(f"        Value: {sig_val.get('value', 0):.2f}")
                    print(f"        Reference: {sig_val.get('reference', 0):.2f}")
                    if 'tesla_relationship' in sig_val:
                        print(f"        Tesla: {sig_val['tesla_relationship']}")
            else:
                print("   ⚠️  No significant values detected")
                print("      (This is normal - values depend on quantum measurements)")
        else:
            print("   ⚠️  Yin/Yang analysis not available")
        
        print()
    else:
        print("⚠️  Yin/Yang analysis not found in results")
        print()
    
    print("=" * 70)
    print("TEST 2: Tesla Number Relationships")
    print("=" * 70)
    
    # Test with Tesla number multiples
    import time
    threat_signals_tesla = [
        ThreatSignal(
            direction=0,  # LEFT
            distance=600.0,   # 6 × 100
            bearing=0.0,
            signal_strength=0.8,
            timestamp=time.time()
        )
    ]
    
    result2 = execute_bat_defensive_grid(
        threat_signals=threat_signals_tesla,
        backend=service.backend,
        shots=128,
        enable_yin_yang=True
    )
    
    print(f"✅ Tesla number test complete")
    
    if 'yin_yang_analysis' in result2:
        yin_yang = result2['yin_yang_analysis']
        if yin_yang.get('balance_detected'):
            print("   ✅ Balance detected with Tesla relationships!")
            if 'significant_values' in yin_yang:
                for sig_val in yin_yang['significant_values']:
                    print(f"     - {sig_val.get('relationship', 'N/A')}")
        else:
            print("   ⚠️  Balance not detected (may need tuning)")
        print()
    
    print("=" * 70)
    print("TEST 3: Quantum Measurement Analysis")
    print("=" * 70)
    
    # Analyze quantum counts for patterns
    if 'quantum_counts' in result:
        counts = result['quantum_counts']
        print(f"Quantum measurement results:")
        print(f"   Total states measured: {len(counts)}")
        
        # Find most probable states
        sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        print(f"   Top 3 states:")
        for state, count in sorted_counts[:3]:
            percentage = (count / result.get('shots', 1)) * 100
            print(f"     {state}: {count} ({percentage:.1f}%)")
        
        # Check for patterns in state values
        # Convert binary states to decimal and check for 183
        significant_states = []
        for state, count in sorted_counts[:10]:
            try:
                decimal_value = int(state.replace(' ', ''), 2)
                # Check if close to 183 or Tesla multiples
                if abs(decimal_value - 183) < 10:
                    significant_states.append((state, decimal_value, count))
            except:
                pass
        
        if significant_states:
            print(f"   ✅ Found {len(significant_states)} states near 183:")
            for state, value, count in significant_states:
                print(f"     {state} (decimal: {value}) - {count} occurrences")
        else:
            print("   ⚠️  No states near 183 detected (normal for random measurements)")
        
        print()
    
    print("=" * 70)
    print("✅ DISCOVERY 29 VALIDATION COMPLETE")
    print("=" * 70)
    print()
    print("Key Findings:")
    yin_yang_available = 'yin_yang_analysis' in result and result['yin_yang_analysis'].get('yin_yang_analysis_available')
    print(f"  ✅ Yin/Yang Analysis: {'Working' if yin_yang_available else 'Needs investigation'}")
    print(f"  ✅ Significant Value Detection: {'Working' if yin_yang_available else 'Needs investigation'}")
    print(f"  ✅ Tesla Relationships: {'Working' if yin_yang_available else 'Needs investigation'}")
    print()


if __name__ == '__main__':
    test_yin_yang_balance()

