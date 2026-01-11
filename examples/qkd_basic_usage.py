#!/usr/bin/env python3
"""
QKD Basic Usage Example
Demonstrates basic QKD protocol usage for key exchange
"""

import sys
import os

# Add parent directory to path to import QKD modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from qkd.qkd_protocol import QKDProtocol
import secrets


def main():
    """Basic QKD key exchange example"""
    
    print("=" * 60)
    print("QKD Basic Usage Example")
    print("=" * 60)
    print()
    
    # Step 1: Create shared secret (in practice, this would be pre-shared)
    shared_secret = secrets.token_bytes(32)
    print(f"✓ Generated shared secret: {shared_secret.hex()[:16]}...")
    print()
    
    # Step 2: Create QKD sessions for Alice and Bob
    print("Creating QKD sessions...")
    alice_session = QKDProtocol(
        party_id="alice",
        session_id="example_session_001",
        shared_secret=shared_secret,
        num_ghz_qubits=12,
        backend_name="ibm_fez"
    )
    
    bob_session = QKDProtocol(
        party_id="bob",
        session_id="example_session_001",
        shared_secret=shared_secret,
        num_ghz_qubits=12,
        backend_name="ibm_fez"
    )
    print("✓ Sessions created")
    print()
    
    # Step 3: Alice initiates QKD
    print("Step 1: Alice initiates QKD...")
    init_message = alice_session.initiate()
    print(f"✓ Init message: {init_message.message_type.value}")
    print()
    
    # Step 4: Bob processes initiation
    print("Step 2: Bob processes initiation...")
    response = bob_session.process_message(init_message)
    print(f"✓ Response: {response.message_type.value}")
    print()
    
    # Step 5: Continue protocol phases
    print("Step 3: Continuing protocol...")
    current_message = response
    phase_count = 0
    max_phases = 10
    
    while current_message and phase_count < max_phases:
        # Process message on receiving side
        if current_message.message_type.value.startswith("INIT"):
            if current_message.message_type.value == "INIT_REQUEST":
                current_message = bob_session.process_message(current_message)
            else:
                current_message = alice_session.process_message(current_message)
        elif current_message.message_type.value.startswith("AUTH"):
            if current_message.message_type.value == "AUTH_CHALLENGE":
                current_message = bob_session.process_message(current_message)
            else:
                current_message = alice_session.process_message(current_message)
        elif current_message.message_type.value.startswith("QKG"):
            if current_message.message_type.value == "QKG_REQUEST":
                current_message = bob_session.process_message(current_message)
            else:
                current_message = alice_session.process_message(current_message)
        else:
            # Process on both sides
            if phase_count % 2 == 0:
                current_message = bob_session.process_message(current_message)
            else:
                current_message = alice_session.process_message(current_message)
        
        phase_count += 1
        print(f"  Phase {phase_count}: {current_message.message_type.value if current_message else 'Complete'}")
        
        # Check if we have a shared key
        if alice_session.shared_key and bob_session.shared_key:
            if alice_session.shared_key == bob_session.shared_key:
                print()
                print("=" * 60)
                print("✓ QKD Protocol Complete!")
                print("=" * 60)
                print(f"Shared Key Length: {len(alice_session.shared_key)} bytes")
                print(f"Shared Key (hex): {alice_session.shared_key.hex()[:32]}...")
                print()
                return
    
    print()
    print("⚠ Protocol did not complete in example")
    print("See QKD_API_DOCUMENTATION.md for complete API usage")


if __name__ == "__main__":
    main()

