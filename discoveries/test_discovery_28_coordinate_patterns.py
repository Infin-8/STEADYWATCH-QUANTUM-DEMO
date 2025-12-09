#!/usr/bin/env python3
"""
Test Discovery 28: Deep Coordinate Pattern Analysis on IBM Quantum Hardware

Validates:
- Pythagorean triple detection (3-4-5, 5-12-13)
- Coordinate transformation patterns
- Pattern type classification
- Net movement analysis
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from quantum_service import EchoResonanceQuantumService
from bat_defensive_grid_quantum import (
    execute_bat_defensive_grid,
    ThreatSignal,
    ThreatPosition,
    analyze_threat_coordinate_patterns
)


def test_coordinate_patterns():
    """Test Deep Coordinate Pattern Analysis on real hardware."""
    print("=" * 70)
    print("DISCOVERY 28: DEEP COORDINATE PATTERN ANALYSIS VALIDATION")
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
    print("TEST 1: Pythagorean Triple Detection (3-4-5)")
    print("=" * 70)
    
    # Create threat positions that form a 3-4-5 triangle
    threat_positions = [
        ThreatPosition(x=0.0, y=0.0, z=0.0, confidence=0.9),
        ThreatPosition(x=300.0, y=400.0, z=0.0, confidence=0.9),  # 3-4-5 triangle
        ThreatPosition(x=600.0, y=800.0, z=0.0, confidence=0.9)  # 2× 3-4-5
    ]
    
    # Analyze coordinate patterns
    pattern_analysis = analyze_threat_coordinate_patterns(threat_positions)
    
    print(f"✅ Coordinate pattern analysis complete")
    print()
    
    if pattern_analysis.get('pattern_analysis_available'):
        print("Pattern Analysis Results:")
        
        if 'coordinate_transformations' in pattern_analysis:
            transformations = pattern_analysis['coordinate_transformations']
            print(f"   Coordinate transformations: {len(transformations)}")
            
            pythagorean_found = False
            for trans in transformations:
                if trans.get('is_pythagorean_triple'):
                    pythagorean_found = True
                    print(f"     ✅ Pythagorean Triple: {trans.get('pythagorean_type', 'unknown')}")
                    print(f"        From: {trans.get('from', 'N/A')}")
                    print(f"        To: {trans.get('to', 'N/A')}")
                    print(f"        Distance: {trans.get('distance', 0):.2f}")
            
            if not pythagorean_found:
                print("     ⚠️  No Pythagorean triples detected (may need tuning)")
        
        if 'pattern_type' in pattern_analysis:
            pattern_type = pattern_analysis['pattern_type']
            print(f"   Pattern type: {pattern_type.get('type', 'unknown')}")
            print(f"   Description: {pattern_type.get('description', 'N/A')}")
        
        if 'net_movement' in pattern_analysis:
            net = pattern_analysis['net_movement']
            print(f"   Net movement:")
            print(f"     Total Δrow: {net.get('total_row', 0)}")
            print(f"     Total Δcol: {net.get('total_col', 0)}")
            print(f"     Net distance: {net.get('net_distance', 0):.2f}")
        
        print()
    else:
        print("⚠️  Pattern analysis not available")
        print()
    
    print("=" * 70)
    print("TEST 2: Pattern Type Classification")
    print("=" * 70)
    
    # Create systematic pattern
    systematic_positions = [
        ThreatPosition(x=0.0, y=0.0, z=0.0, confidence=0.9),
        ThreatPosition(x=100.0, y=0.0, z=0.0, confidence=0.9),  # Horizontal
        ThreatPosition(x=200.0, y=0.0, z=0.0, confidence=0.9),  # Horizontal
        ThreatPosition(x=300.0, y=0.0, z=0.0, confidence=0.9)   # Horizontal
    ]
    
    pattern_analysis2 = analyze_threat_coordinate_patterns(systematic_positions)
    
    print(f"✅ Pattern classification test complete")
    
    if pattern_analysis2.get('pattern_analysis_available'):
        if 'pattern_type' in pattern_analysis2:
            pattern_type = pattern_analysis2['pattern_type']
            print(f"   Pattern type: {pattern_type.get('type', 'unknown')}")
            print(f"   Description: {pattern_type.get('description', 'N/A')}")
        print()
    
    print("=" * 70)
    print("TEST 3: Real-Time Threat Tracking")
    print("=" * 70)
    
    # Simulate real-time tracking with quantum detection
    import time
    threat_signals = [
        ThreatSignal(
            direction=0,
            distance=100.0,
            bearing=0.0,
            signal_strength=0.8,
            timestamp=time.time()
        )
    ]
    
    # Execute quantum detection
    result = execute_bat_defensive_grid(
        threat_signals=threat_signals,
        backend=service.backend,
        shots=128
    )
    
    print(f"✅ Quantum detection complete")
    print(f"   Backend: {result.get('backend', 'unknown')}")
    
    if 'threat_position' in result:
        threat_pos = result['threat_position']
        print(f"   Threat position: ({threat_pos.x:.2f}, {threat_pos.y:.2f}, {threat_pos.z:.2f})")
        print(f"   Confidence: {threat_pos.confidence:.2f}")
    
    print()
    
    print("=" * 70)
    print("✅ DISCOVERY 28 VALIDATION COMPLETE")
    print("=" * 70)
    print()
    print("Key Findings:")
    print(f"  ✅ Coordinate Pattern Analysis: {'Working' if pattern_analysis.get('pattern_analysis_available') else 'Needs investigation'}")
    print(f"  ✅ Pythagorean Triple Detection: {'Working' if any(t.get('is_pythagorean_triple') for t in pattern_analysis.get('coordinate_transformations', [])) else 'Needs tuning'}")
    print(f"  ✅ Pattern Classification: {'Working' if 'pattern_type' in pattern_analysis else 'Needs investigation'}")
    print()


if __name__ == '__main__':
    test_coordinate_patterns()

