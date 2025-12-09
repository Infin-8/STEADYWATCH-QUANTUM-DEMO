#!/usr/bin/env python3
"""
IBM Quantum Setup Helper
Guides you through setting up IBM Quantum integration step-by-step
"""

import os
import sys
from pathlib import Path

def check_qiskit_installation():
    """Check if Qiskit and IBM provider are installed."""
    print("=" * 70)
    print("Step 1: Checking Qiskit Installation")
    print("=" * 70)
    
    try:
        import qiskit
        print(f"✅ Qiskit installed: {qiskit.__version__}")
    except ImportError:
        print("❌ Qiskit not installed")
        print("   Install with: pip install qiskit")
        return False
    
    try:
        from qiskit_ibm_provider import IBMProvider
        print("✅ Qiskit IBM Provider installed")
        return True
    except ImportError:
        print("❌ Qiskit IBM Provider not installed")
        print("   Install with: pip install qiskit-ibm-provider")
        return False

def check_token_configured():
    """Check if IBM Quantum token is configured."""
    print("\n" + "=" * 70)
    print("Step 2: Checking IBM Quantum Token Configuration")
    print("=" * 70)
    
    # Check environment variable
    env_token = os.getenv('IBM_QUANTUM_TOKEN')
    if env_token:
        print("✅ IBM Quantum token found in environment variable")
        return True
    
    # Check encrypted secrets
    try:
        from secrets_manager import SecretsManager
        secrets = SecretsManager().load_secrets()
        if secrets.get('ibm_quantum_token'):
            print("✅ IBM Quantum token found in encrypted secrets")
            return True
    except Exception as e:
        print(f"⚠️  Could not check encrypted secrets: {e}")
    
    # Check Qiskit saved account
    try:
        from qiskit_ibm_provider import IBMProvider
        try:
            provider = IBMProvider()
            print("✅ IBM Quantum token found in Qiskit saved account")
            return True
        except Exception:
            pass
    except ImportError:
        pass
    
    print("❌ IBM Quantum token not configured")
    return False

def test_connection():
    """Test connection to IBM Quantum."""
    print("\n" + "=" * 70)
    print("Step 3: Testing IBM Quantum Connection")
    print("=" * 70)
    
    try:
        from qiskit_ibm_provider import IBMProvider
        
        # Try to get token from various sources
        token = None
        
        # Check environment
        token = os.getenv('IBM_QUANTUM_TOKEN')
        
        # Check secrets
        if not token:
            try:
                from secrets_manager import SecretsManager
                secrets = SecretsManager().load_secrets()
                token = secrets.get('ibm_quantum_token')
            except Exception:
                pass
        
        # Load provider
        try:
            provider = IBMProvider()
        except Exception as e:
            if "No IBM Quantum credentials found" in str(e) or "No credentials" in str(e):
                print("❌ No IBM Quantum credentials found")
                print("\nTo configure:")
                print("1. Get token from: https://quantum.ibm.com/account")
                print("2. Run: python3 configure_ibm_quantum_token.py")
                return False
            raise
        
        # Get backends
        backends = provider.backends()
        available = [b for b in backends if b.status().operational]
        
        print(f"✅ Connected to IBM Quantum!")
        print(f"   Total backends: {len(backends)}")
        print(f"   Available backends: {len(available)}")
        
        if available:
            print("\n   Available systems:")
            for backend in available[:5]:
                config = backend.configuration()
                print(f"   - {backend.name()}: {config.n_qubits} qubits")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def configure_token_interactive():
    """Interactive token configuration."""
    print("\n" + "=" * 70)
    print("IBM Quantum Token Configuration")
    print("=" * 70)
    print()
    print("To get your IBM Quantum token:")
    print("1. Go to: https://quantum.ibm.com/account")
    print("2. Sign in (or create account if needed)")
    print("3. Click 'Copy token' or 'Generate new token'")
    print("4. Copy the token")
    print()
    
    token = input("Paste your IBM Quantum token (or press Enter to skip): ").strip()
    
    if not token:
        print("⚠️  Token configuration skipped")
        return False
    
    # Save to encrypted secrets
    try:
        from secrets_manager import SecretsManager
        secrets_manager = SecretsManager()
        secrets = secrets_manager.load_secrets()
        secrets['ibm_quantum_token'] = token
        secrets_manager.save_secrets(secrets)
        print("✅ Token saved to encrypted secrets")
    except Exception as e:
        print(f"⚠️  Could not save to encrypted secrets: {e}")
        print("   Saving to Qiskit instead...")
    
    # Also save to Qiskit
    try:
        from qiskit_ibm_provider import IBMProvider
        IBMProvider.save_account(token=token, overwrite=True)
        print("✅ Token saved to Qiskit")
        return True
    except Exception as e:
        print(f"❌ Failed to save token: {e}")
        return False

def run_test_circuit():
    """Run a test circuit on IBM Quantum."""
    print("\n" + "=" * 70)
    print("Step 4: Running Test Circuit")
    print("=" * 70)
    
    try:
        from qiskit import QuantumCircuit
        from qiskit_ibm_provider import IBMProvider
        
        provider = IBMProvider()
        backends = provider.backends()
        available = [b for b in backends if b.status().operational]
        
        if not available:
            print("⚠️  No available backends, using simulator")
            from qiskit_aer import AerSimulator
            backend = AerSimulator()
        else:
            # Use smallest available backend for test
            backend = min(available, key=lambda b: b.configuration().n_qubits)
            print(f"Using backend: {backend.name()} ({backend.configuration().n_qubits} qubits)")
        
        # Create simple test circuit
        qc = QuantumCircuit(2, 2)
        qc.h(0)
        qc.cx(0, 1)
        qc.measure_all()
        
        # Run circuit
        print("Running test circuit...")
        job = backend.run(qc, shots=1024)
        result = job.result()
        counts = result.get_counts()
        
        print("✅ Test circuit executed successfully!")
        print(f"   Results: {counts}")
        return True
        
    except Exception as e:
        print(f"❌ Test circuit failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main setup process."""
    print("\n" + "=" * 70)
    print("IBM Quantum Integration Setup")
    print("=" * 70)
    print()
    
    # Step 1: Check installation
    if not check_qiskit_installation():
        print("\n❌ Please install Qiskit and IBM Provider first:")
        print("   pip install qiskit qiskit-ibm-provider")
        return False
    
    # Step 2: Check token
    token_configured = check_token_configured()
    
    if not token_configured:
        print("\n⚠️  Token not configured. Let's configure it now...")
        if not configure_token_interactive():
            print("\n❌ Setup incomplete. Please configure token manually.")
            return False
    
    # Step 3: Test connection
    if not test_connection():
        print("\n❌ Connection test failed. Please check your token.")
        return False
    
    # Step 4: Run test circuit
    run_test = input("\nRun test circuit on IBM Quantum? (y/n): ").strip().lower()
    if run_test == 'y':
        run_test_circuit()
    
    print("\n" + "=" * 70)
    print("✅ IBM Quantum Setup Complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Use IBM Quantum in your code:")
    print("   from quantum_service import EchoResonanceQuantumService")
    print("   service = EchoResonanceQuantumService(use_real_hardware=True)")
    print()
    print("2. Apply for research credits:")
    print("   https://quantum.ibm.com/programs/researchers")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

