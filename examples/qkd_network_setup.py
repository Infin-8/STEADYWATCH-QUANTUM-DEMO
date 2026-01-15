#!/usr/bin/env python3
"""
Network QKD Setup Example
Demonstrates setting up a network QKD system with multiple nodes
"""

import sys
import os

# Add parent directory to path to import QKD modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from qkd.network_qkd import create_network_qkd, NodeRole
import secrets


def main():
    """Network QKD setup example"""
    
    print("=" * 60)
    print("Network QKD Setup Example")
    print("=" * 60)
    print()
    
    # Step 1: Create network QKD instance
    print("Creating Network QKD instance...")
    network = create_network_qkd(
        network_id="example_network",
        use_hardware=False  # Use simulator for example
    )
    print("✓ Network created")
    print()
    
    # Step 2: Add nodes to network
    print("Adding nodes to network...")
    
    # Add Alice (endpoint)
    alice_id = network.add_node(
        node_id="alice",
        role=NodeRole.ENDPOINT,
        position=(0, 0)
    )
    print(f"✓ Added node: {alice_id} (ENDPOINT)")
    
    # Add Bob (endpoint)
    bob_id = network.add_node(
        node_id="bob",
        role=NodeRole.ENDPOINT,
        position=(10, 10)
    )
    print(f"✓ Added node: {bob_id} (ENDPOINT)")
    
    # Add relay nodes
    relay1_id = network.add_node(
        node_id="relay1",
        role=NodeRole.RELAY,
        position=(5, 5)
    )
    print(f"✓ Added node: {relay1_id} (RELAY)")
    
    relay2_id = network.add_node(
        node_id="relay2",
        role=NodeRole.RELAY,
        position=(7, 7)
    )
    print(f"✓ Added node: {relay2_id} (RELAY)")
    print()
    
    # Step 3: Add connections
    print("Adding connections...")
    network.add_connection(alice_id, relay1_id, distance=5.0)
    print(f"✓ Connected: {alice_id} <-> {relay1_id}")
    
    network.add_connection(relay1_id, relay2_id, distance=3.0)
    print(f"✓ Connected: {relay1_id} <-> {relay2_id}")
    
    network.add_connection(relay2_id, bob_id, distance=4.0)
    print(f"✓ Connected: {relay2_id} <-> {bob_id}")
    print()
    
    # Step 4: Display network topology
    print("Network Topology:")
    print("-" * 60)
    topology = network.get_topology()
    print(f"Nodes: {len(topology['nodes'])}")
    print(f"Connections: {len(topology['connections'])}")
    print()
    print("Nodes:")
    for node_id, node_data in topology['nodes'].items():
        print(f"  - {node_id}: {node_data['role'].value} at {node_data['position']}")
    print()
    print("Connections:")
    for conn in topology['connections']:
        print(f"  - {conn['from']} <-> {conn['to']} (distance: {conn['distance']})")
    print()
    
    # Step 5: Find optimal path
    print("Finding optimal path from Alice to Bob...")
    paths = network.find_paths(alice_id, bob_id)
    if paths:
        optimal_path = paths[0]
        print(f"✓ Optimal path found: {' -> '.join(optimal_path.node_ids)}")
        print(f"  Total distance: {optimal_path.total_distance}")
        print(f"  Estimated hops: {optimal_path.estimated_hops}")
    else:
        print("⚠ No path found")
    print()
    
    print("=" * 60)
    print("✓ Network QKD Setup Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  - Use network.distribute_key() to distribute keys")
    print("  - See NETWORK_QKD_DOCUMENTATION.md for complete API")


if __name__ == "__main__":
    main()

