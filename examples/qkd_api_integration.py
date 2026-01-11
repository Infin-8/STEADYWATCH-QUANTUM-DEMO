#!/usr/bin/env python3
"""
QKD API Integration Example
Demonstrates how to use the QKD API endpoints
"""

import requests
import json
import secrets


def main():
    """QKD API integration example"""
    
    print("=" * 60)
    print("QKD API Integration Example")
    print("=" * 60)
    print()
    
    # API base URL (update with your server URL)
    base_url = "http://quantum.local:5002/api/qkd"
    
    print(f"API Base URL: {base_url}")
    print()
    
    # Step 1: Test endpoint
    print("Step 1: Testing QKD endpoint availability...")
    try:
        response = requests.get(f"{base_url}/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ QKD endpoint available: {data.get('qkd_available', False)}")
        else:
            print(f"⚠ Endpoint returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Could not connect to API: {e}")
        print("  Make sure the API server is running")
        print("  Update base_url if using a different server")
        return
    print()
    
    # Step 2: Initiate QKD session
    print("Step 2: Initiating QKD session...")
    shared_secret = secrets.token_hex(32)
    
    init_payload = {
        "session_id": "example_api_session_001",
        "shared_secret": shared_secret,
        "use_hardware": False  # Use simulator for example
    }
    
    try:
        response = requests.post(
            f"{base_url}/initiate",
            json=init_payload,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Session initiated: {data.get('session_id')}")
            session_id = data.get('session_id')
        else:
            print(f"⚠ Initiation failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return
    except requests.exceptions.RequestException as e:
        print(f"⚠ Request failed: {e}")
        return
    print()
    
    # Step 3: Get session status
    print("Step 3: Getting session status...")
    try:
        response = requests.get(
            f"{base_url}/session",
            params={"session_id": session_id},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Session status retrieved")
            print(f"  Status: {data.get('status')}")
            print(f"  Phase: {data.get('current_phase')}")
        else:
            print(f"⚠ Status check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Request failed: {e}")
    print()
    
    # Step 4: Network QKD - Get topology
    print("Step 4: Network QKD - Getting topology...")
    try:
        response = requests.get(
            f"{base_url}/network/topology",
            params={"network_id": "default"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Topology retrieved")
            print(f"  Nodes: {len(data.get('nodes', {}))}")
            print(f"  Connections: {len(data.get('connections', []))}")
        else:
            print(f"⚠ Topology request failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Request failed: {e}")
    print()
    
    print("=" * 60)
    print("✓ API Integration Example Complete!")
    print("=" * 60)
    print()
    print("See QKD_API_DOCUMENTATION.md for complete API reference")
    print("All 14 endpoints are documented with examples")


if __name__ == "__main__":
    main()

