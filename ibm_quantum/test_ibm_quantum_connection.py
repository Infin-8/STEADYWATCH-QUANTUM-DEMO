#!/usr/bin/env python3
"""
Test IBM Quantum Connection
Verifies token and CRN are configured correctly
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from secrets_manager import SecretsManager

def main():
    print("=" * 70)
    print("Testing IBM Quantum Connection")
    print("=" * 70)
    print()
    
    # Load credentials
    secrets = SecretsManager().load_secrets()
    token = secrets.get('ibm_quantum_token')
    crn = secrets.get('ibm_quantum_crn')
    
    if not token:
        print("❌ API token not found in secrets")
        print("   Run: python3 configure_ibm_quantum_credentials.py")
        return False
    
    if not crn:
        print("❌ CRN not found in secrets")
        print("   Run: python3 configure_ibm_quantum_credentials.py")
        return False
    
    print("✅ Credentials loaded from secrets")
    print()
    
    # Test with Runtime Service (CRN method)
    print("Testing QiskitRuntimeService (with CRN)...")
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
        
        service = QiskitRuntimeService(
            channel="ibm_quantum_platform",
            token=token,
            instance=crn
        )
        
        backends = service.backends()
        available = [b for b in backends if b.status().operational]
        
        print(f"✅ Connected to IBM Quantum Runtime Service!")
        print(f"   Total backends: {len(backends)}")
        print(f"   Available backends: {len(available)}")
        
        if available:
            print("\n   Available systems:")
            for backend in available[:5]:
                try:
                    config = backend.configuration()
                    # Handle both method and property access
                    if callable(getattr(backend, 'name', None)):
                        backend_name = backend.name()
                    else:
                        backend_name = getattr(backend, 'name', str(backend))
                    print(f"   - {backend_name}: {config.n_qubits} qubits")
                except Exception as e:
                    backend_name = str(backend)
                    print(f"   - {backend_name}")
        
        print()
        print("=" * 70)
        print("✅ Connection Test Successful!")
        print("=" * 70)
        return True
        
    except ImportError:
        print("⚠️  qiskit_ibm_runtime not installed")
        print("   Install with: pip install qiskit-ibm-runtime")
        print()
        print("Trying Provider API (fallback)...")
        
    except Exception as e:
        print(f"❌ Runtime Service connection failed: {e}")
        print()
        print("Trying Provider API (fallback)...")
    
    # Fallback to Provider API
    try:
        from qiskit_ibm_provider import IBMProvider
        provider = IBMProvider()
        backends = provider.backends()
        available = [b for b in backends if b.status().operational]
        
        print(f"✅ Connected via Provider API!")
        print(f"   Total backends: {len(backends)}")
        print(f"   Available backends: {len(available)}")
        
        if available:
            print("\n   Available systems:")
            for backend in available[:5]:
                config = backend.configuration()
                print(f"   - {backend.name()}: {config.n_qubits} qubits")
        
        print()
        print("=" * 70)
        print("✅ Connection Test Successful (Provider API)!")
        print("=" * 70)
        return True
        
    except ImportError:
        print("❌ qiskit_ibm_provider not installed")
        print("   Install with: pip install qiskit-ibm-provider")
        return False
    except Exception as e:
        print(f"❌ Provider API also failed: {e}")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

