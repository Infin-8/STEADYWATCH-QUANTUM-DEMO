#!/usr/bin/env python3
"""
Test All Discoveries 26-29 on IBM Quantum Hardware

Runs all discovery validation tests in sequence.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import subprocess
import time


def run_test(test_file):
    """Run a test file and return success status."""
    print("\n" + "=" * 70)
    print(f"Running: {test_file}")
    print("=" * 70)
    print()
    
    try:
        result = subprocess.run(
            [sys.executable, test_file],
            capture_output=False,
            text=True,
            timeout=300  # 5 minute timeout per test
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"❌ Test timed out: {test_file}")
        return False
    except Exception as e:
        print(f"❌ Error running {test_file}: {e}")
        return False


def main():
    """Run all discovery validation tests."""
    print("=" * 70)
    print("COMPLETE DISCOVERY VALIDATION SUITE")
    print("Discoveries 26-29 on IBM Quantum Hardware")
    print("=" * 70)
    print()
    
    tests = [
        'test_discovery_26_caching.py',
        'test_discovery_27_tesla_math.py',
        'test_discovery_28_coordinate_patterns.py',
        'test_discovery_29_yin_yang.py'
    ]
    
    results = {}
    start_time = time.time()
    
    for test_file in tests:
        test_path = os.path.join(os.path.dirname(__file__), test_file)
        if os.path.exists(test_path):
            success = run_test(test_path)
            results[test_file] = success
            time.sleep(2)  # Brief pause between tests
        else:
            print(f"⚠️  Test file not found: {test_file}")
            results[test_file] = False
    
    total_time = time.time() - start_time
    
    # Summary
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print()
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_file, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {status}: {test_file}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    print(f"Total time: {total_time:.1f} seconds")
    print()
    
    if passed == total:
        print("=" * 70)
        print("🎉 ALL DISCOVERIES VALIDATED SUCCESSFULLY!")
        print("=" * 70)
    else:
        print("=" * 70)
        print("⚠️  SOME TESTS FAILED - Review output above")
        print("=" * 70)
    
    print()


if __name__ == '__main__':
    main()

