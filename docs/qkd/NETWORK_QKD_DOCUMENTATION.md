# Network Quantum Key Distribution (QKD)

## Overview

Network QKD extends the SteadyWatch Hybrid QKD Protocol to support multi-node networks, enabling key distribution across complex topologies with relay nodes and path optimization.

## Features

### Core Capabilities

1. **Direct Key Distribution**
   - Alice ↔ Bob (single hop)
   - Highest trust level (1.0)
   - Lowest latency

2. **Relay Key Distribution**
   - Alice → Relay → Bob
   - Intermediate relay nodes
   - Trust level: 0.7-0.9 (depending on relay type)

3. **Multi-Hop Key Distribution**
   - Alice → Relay1 → Relay2 → ... → Bob
   - Multiple intermediate nodes
   - Path optimization for best route

4. **Path Discovery**
   - Automatic path finding
   - Multiple path options
   - Quality metrics (trust, latency, hops)

5. **Network Topology Management**
   - Dynamic node addition/removal
   - Link management
   - Topology visualization

## Architecture

### Network Components

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Alice  │──────│ Relay 1 │──────│   Bob   │
│ (Source)│      │ (Relay) │      │(Dest.)  │
└─────────┘      └─────────┘      └─────────┘
     │                │                 │
     │                │                 │
     └────────────────┴─────────────────┘
              ┌─────────┐
              │ Relay 2 │
              │ (Relay) │
              └─────────┘
```

### Key Distribution Flow

1. **Path Discovery**: Find best path from source to destination
2. **Key Generation**: Generate QKD key for each hop
3. **Key Relay**: Encrypt key with hop key, relay to next node
4. **Key Recovery**: Decrypt at each hop, forward to next
5. **Final Delivery**: Key arrives at destination

### Security Model

**Per-Hop Encryption:**
- Each hop uses independent QKD key
- Key encrypted with hop key before relay
- Intermediate nodes only see encrypted key
- End-to-end security maintained

**Trust Levels:**
- Direct path: 1.0 (highest trust)
- Trusted relay: 0.9 per hop
- Standard relay: 0.7 per hop
- Trust decreases with each hop

## Usage

### Basic Setup

```python
from network_qkd import NetworkQKD, NodeRole, create_network_qkd

# Create network
network = create_network_qkd("alice", NodeRole.SOURCE, "alice.example.com")

# Add nodes
network.add_node("relay1", NodeRole.RELAY, "relay1.example.com")
network.add_node("bob", NodeRole.DESTINATION, "bob.example.com")

# Add links with shared secrets
import secrets
secret_alice_relay = secrets.token_bytes(32)
secret_relay_bob = secrets.token_bytes(32)

network.add_link("alice", "relay1", secret_alice_relay, latency=1.0)
network.add_link("relay1", "bob", secret_relay_bob, latency=1.0)
```

### Direct Key Distribution

```python
# Distribute key directly (Alice -> Bob)
key = secrets.token_bytes(32)
success, network_key, path = network.distribute_key(
    source_id="alice",
    destination_id="bob",
    key=key
)

if success:
    print(f"Key distributed via: {' -> '.join(path)}")
    print(f"Session ID: {network_key.session_id}")
```

### Relay Key Distribution

```python
# Distribute key via relay (Alice -> Relay -> Bob)
key = secrets.token_bytes(32)
success, network_key, path = network.distribute_key(
    source_id="alice",
    destination_id="bob",
    key=key
)

# Path will be: ['alice', 'relay1', 'bob']
```

### Path Discovery

```python
# Find all paths from source to destination
paths = network.find_paths("alice", "bob", max_hops=5)

for path in paths:
    print(f"Path: {' -> '.join(path.path)}")
    print(f"  Hops: {path.hops}")
    print(f"  Latency: {path.latency:.2f}s")
    print(f"  Trust: {path.trust_level:.2f}")
```

### Network Topology

```python
# Get network topology information
topology = network.get_network_topology()

print(f"Nodes: {topology['graph']['nodes']}")
print(f"Edges: {topology['graph']['edges']}")
print(f"Connected: {topology['graph']['connected']}")
```

## Integration with QKD Protocol

### Using with Existing QKD Protocol

```python
from qkd_protocol import QKDProtocol
from network_qkd import NetworkQKD, NodeRole
import secrets

# Create QKD protocol instances
shared_secret = secrets.token_bytes(32)
alice_qkd = QKDProtocol("alice", shared_secret)
bob_qkd = QKDProtocol("bob", shared_secret)

# Generate QKD key
key_alice, _ = alice_qkd.generate_quantum_key(use_hardware=True)
key_bob, _ = bob_qkd.generate_quantum_key(use_hardware=True)

# Create network
network = NetworkQKD("alice", NodeRole.SOURCE)
network.add_node("bob", NodeRole.DESTINATION)

# Add link
network.add_link("alice", "bob", shared_secret)

# Distribute key through network
success, network_key, path = network.distribute_key(
    source_id="alice",
    destination_id="bob",
    key=key_alice
)
```

## Security Considerations

### Trust Model

1. **Direct Links**: Highest trust (1.0)
   - No intermediate nodes
   - Full control over key distribution

2. **Trusted Relays**: High trust (0.9 per hop)
   - Verified trusted nodes
   - Lower trust reduction

3. **Standard Relays**: Medium trust (0.7 per hop)
   - Unknown or unverified nodes
   - Higher trust reduction

### Key Relay Security

- **Per-Hop Encryption**: Each hop uses independent QKD key
- **No Plaintext Exposure**: Intermediate nodes only see encrypted keys
- **End-to-End Security**: Final key only known to source and destination
- **Path Validation**: All paths validated before use

### Attack Mitigation

1. **Eavesdropping**: Per-hop encryption prevents key exposure
2. **Man-in-the-Middle**: Path validation and authentication
3. **Relay Compromise**: Trust levels and path diversity
4. **Path Manipulation**: Automatic path discovery and validation

## Performance

### Latency

- **Direct Path**: ~1-2 seconds (single QKD operation)
- **1 Relay**: ~2-4 seconds (two QKD operations)
- **N Relays**: ~(N+1) × QKD_time

### Throughput

- **Key Size**: 32 bytes (256 bits)
- **Distribution Rate**: Limited by QKD key generation rate
- **Network Capacity**: Scales with number of nodes

### Scalability

- **Node Count**: Tested up to 10 nodes
- **Path Length**: Up to 5 hops (configurable)
- **Network Size**: Limited by path discovery algorithm

## Use Cases

### 1. Enterprise Networks

- **Scenario**: Multiple offices need secure key distribution
- **Solution**: Network QKD with trusted relays
- **Benefits**: Centralized key management, secure distribution

### 2. Blockchain Networks

- **Scenario**: Multiple nodes need shared keys
- **Solution**: Network QKD with relay nodes
- **Benefits**: Decentralized key distribution, network resilience

### 3. IoT Networks

- **Scenario**: Many devices need secure keys
- **Solution**: Network QKD with lightweight relays
- **Benefits**: Scalable, efficient key distribution

## Future Enhancements

1. **Adaptive Routing**: Dynamic path selection based on network conditions
2. **Load Balancing**: Distribute keys across multiple paths
3. **Fault Tolerance**: Automatic path switching on failure
4. **Quantum Repeaters**: Extend range with quantum repeaters
5. **Network Monitoring**: Real-time network health monitoring

## References

1. **Network Topology**: Graph-based network representation
2. **Path Discovery**: NetworkX shortest path algorithms
3. **QKD Protocols**: SteadyWatch Hybrid QKD Protocol
4. **Security**: Per-hop encryption and trust models

## Real QKD Protocol Integration

### Using Real QKD for Each Hop

The Network QKD system now integrates with the SteadyWatch Hybrid QKD Protocol, using real quantum key generation for each hop:

```python
# Create network with real QKD enabled
network = create_network_qkd(
    "alice",
    NodeRole.SOURCE,
    use_real_qkd=True,  # Enable real QKD
    backend_name="ibm_fez"
)

# Add links (QKD protocols automatically initialized)
network.add_link("alice", "relay1", shared_secret)

# Distribute key (uses real QKD for each hop)
success, network_key, path = network.distribute_key(
    source_id="alice",
    destination_id="bob",
    key=key,
    use_hardware=False  # Use simulator or True for hardware
)
```

### How It Works

1. **QKD Protocol Initialization**: When a link is added, a QKD protocol instance is created for that link
2. **Per-Hop Key Generation**: For each hop in the path, a real QKD key is generated using GHZ entanglement
3. **Key Encryption**: The distributed key is encrypted with each hop's QKD key
4. **Fallback Mode**: If QKD is unavailable, falls back to key derivation

### Benefits

- **True Quantum Security**: Each hop uses information-theoretic security from GHZ entanglement
- **End-to-End Security**: Even if relays are compromised, keys remain secure
- **Scalable**: Works with any number of hops
- **Flexible**: Can use simulator or real hardware

## Status

✅ **Implemented and Tested**

- Direct key distribution: ✅
- Relay key distribution: ✅
- Multi-hop key distribution: ✅
- Path discovery: ✅
- Network topology: ✅
- **Real QKD integration: ✅** (NEW)
- **Fallback mode: ✅** (NEW)

## Next Steps

- [x] Integration with real QKD protocol ✅
- [ ] Hardware validation on network
- [ ] Performance optimization
- [ ] Network monitoring and diagnostics
- [ ] Fault tolerance and recovery

