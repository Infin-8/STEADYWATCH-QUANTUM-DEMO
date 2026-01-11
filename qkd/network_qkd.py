#!/usr/bin/env python3
"""
Network Quantum Key Distribution (QKD)
Multi-node QKD network with key relay and routing

Features:
- Multi-node QKD networks
- Key relay protocols
- Network topology management
- Secure key routing
- Path optimization
"""

import hashlib
import secrets
import time
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
import networkx as nx

# Import QKD protocol for real key generation
try:
    from .qkd_protocol import QKDProtocol
    QKD_AVAILABLE = True
except ImportError:
    QKD_AVAILABLE = False
    QKDProtocol = None


class NodeRole(Enum):
    """Network node roles"""
    SOURCE = "source"  # Key source (Alice)
    DESTINATION = "destination"  # Key destination (Bob)
    RELAY = "relay"  # Intermediate relay node
    TRUSTED_RELAY = "trusted_relay"  # Trusted relay (can see keys)


class NetworkMessageType(Enum):
    """Network QKD message types"""
    KEY_REQUEST = "KEY_REQUEST"
    KEY_RESPONSE = "KEY_RESPONSE"
    KEY_RELAY = "KEY_RELAY"
    PATH_DISCOVERY = "PATH_DISCOVERY"
    PATH_RESPONSE = "PATH_RESPONSE"
    ROUTE_UPDATE = "ROUTE_UPDATE"


@dataclass
class NetworkNode:
    """Network node in QKD network"""
    node_id: str
    role: NodeRole
    address: str  # Network address (IP, URL, etc.)
    shared_secrets: Dict[str, bytes] = field(default_factory=dict)  # node_id -> shared_secret
    keys: Dict[str, bytes] = field(default_factory=dict)  # session_id -> key
    neighbors: Set[str] = field(default_factory=set)  # Neighbor node IDs
    
    def add_neighbor(self, neighbor_id: str):
        """Add neighbor node"""
        self.neighbors.add(neighbor_id)
    
    def has_shared_secret(self, node_id: str) -> bool:
        """Check if shared secret exists with another node"""
        return node_id in self.shared_secrets


@dataclass
class NetworkPath:
    """Path through network for key distribution"""
    path: List[str]  # List of node IDs
    hops: int  # Number of hops
    trust_level: float  # Trust level (0.0 to 1.0)
    latency: float  # Estimated latency (seconds)
    
    def __len__(self):
        return len(self.path)
    
    def is_direct(self) -> bool:
        """Check if path is direct (no relays)"""
        return len(self.path) == 2


@dataclass
class NetworkKey:
    """Network-distributed key"""
    key: bytes
    session_id: str
    source_node: str
    destination_node: str
    path: List[str]  # Path taken through network
    timestamp: int
    ttl: int  # Time to live (seconds)
    
    def is_expired(self) -> bool:
        """Check if key has expired"""
        return time.time() - self.timestamp > self.ttl


class NetworkQKD:
    """
    Network Quantum Key Distribution System
    
    Supports:
    - Direct QKD (Alice <-> Bob)
    - Relay QKD (Alice -> Relay -> Bob)
    - Multi-hop QKD (Alice -> Relay1 -> Relay2 -> Bob)
    - Path discovery and optimization
    """
    
    def __init__(self, node_id: str, role: NodeRole, address: str = "",
                 use_real_qkd: bool = True, backend_name: str = "ibm_fez"):
        """
        Initialize network QKD node.
        
        Args:
            node_id: Unique node identifier
            role: Node role (source, destination, relay)
            address: Network address
            use_real_qkd: If True, use real QKD protocol for key generation
            backend_name: IBM Quantum backend name (if using real QKD)
        """
        self.node_id = node_id
        self.role = role
        self.address = address or node_id
        self.use_real_qkd = use_real_qkd and QKD_AVAILABLE
        self.backend_name = backend_name
        
        # Network topology
        self.network_graph = nx.Graph()
        self.nodes: Dict[str, NetworkNode] = {}
        self.add_node(node_id, role, address)
        
        # Key storage
        self.distributed_keys: Dict[str, NetworkKey] = {}
        
        # Path cache
        self.path_cache: Dict[Tuple[str, str], List[NetworkPath]] = {}
        
        # QKD protocol instances (one per neighbor)
        self.qkd_protocols: Dict[str, QKDProtocol] = {}
    
    def add_node(self, node_id: str, role: NodeRole, address: str = ""):
        """Add node to network"""
        node = NetworkNode(
            node_id=node_id,
            role=role,
            address=address or node_id
        )
        self.nodes[node_id] = node
        self.network_graph.add_node(node_id, role=role.value, address=address)
    
    def add_link(self, node1_id: str, node2_id: str, 
                 shared_secret: bytes, latency: float = 1.0):
        """
        Add link between two nodes.
        
        Args:
            node1_id: First node ID
            node2_id: Second node ID
            shared_secret: Pre-shared secret for authentication
            latency: Link latency (seconds)
        """
        if node1_id not in self.nodes or node2_id not in self.nodes:
            raise ValueError(f"Nodes must exist before adding link")
        
        # Add neighbors
        self.nodes[node1_id].add_neighbor(node2_id)
        self.nodes[node2_id].add_neighbor(node1_id)
        
        # Store shared secrets
        self.nodes[node1_id].shared_secrets[node2_id] = shared_secret
        self.nodes[node2_id].shared_secrets[node1_id] = shared_secret
        
        # Initialize QKD protocols if using real QKD
        if self.use_real_qkd and QKD_AVAILABLE:
            # Create QKD protocol instance for this link
            # Each node needs its own QKD protocol instance
            if node1_id == self.node_id:
                self.qkd_protocols[node2_id] = QKDProtocol(
                    party_id=f"{node1_id}_{node2_id}",
                    shared_secret=shared_secret,
                    num_ghz_qubits=12,
                    backend_name=self.backend_name
                )
            elif node2_id == self.node_id:
                self.qkd_protocols[node1_id] = QKDProtocol(
                    party_id=f"{node2_id}_{node1_id}",
                    shared_secret=shared_secret,
                    num_ghz_qubits=12,
                    backend_name=self.backend_name
                )
        
        # Add edge to graph
        self.network_graph.add_edge(
            node1_id, 
            node2_id,
            shared_secret=shared_secret,
            latency=latency
        )
    
    def find_paths(self, source_id: str, destination_id: str, 
                   max_hops: int = 5) -> List[NetworkPath]:
        """
        Find paths from source to destination.
        
        Args:
            source_id: Source node ID
            destination_id: Destination node ID
            max_hops: Maximum number of hops
            
        Returns:
            List of paths sorted by quality (trust, latency, hops)
        """
        if source_id not in self.nodes or destination_id not in self.nodes:
            return []
        
        # Check cache
        cache_key = (source_id, destination_id)
        if cache_key in self.path_cache:
            return self.path_cache[cache_key]
        
        paths = []
        
        # Find all simple paths
        try:
            all_paths = list(nx.all_simple_paths(
                self.network_graph,
                source_id,
                destination_id,
                cutoff=max_hops
            ))
        except nx.NetworkXNoPath:
            return []
        
        # Convert to NetworkPath objects
        for path in all_paths:
            # Calculate metrics
            hops = len(path) - 1
            latency = self._calculate_path_latency(path)
            trust_level = self._calculate_path_trust(path)
            
            network_path = NetworkPath(
                path=path,
                hops=hops,
                trust_level=trust_level,
                latency=latency
            )
            paths.append(network_path)
        
        # Sort by quality (trust, then latency, then hops)
        paths.sort(key=lambda p: (-p.trust_level, p.latency, p.hops))
        
        # Cache results
        self.path_cache[cache_key] = paths
        
        return paths
    
    def _calculate_path_latency(self, path: List[str]) -> float:
        """Calculate total latency for path"""
        total_latency = 0.0
        for i in range(len(path) - 1):
            edge_data = self.network_graph.get_edge_data(path[i], path[i + 1])
            total_latency += edge_data.get('latency', 1.0)
        return total_latency
    
    def _calculate_path_trust(self, path: List[str]) -> float:
        """Calculate trust level for path"""
        # Trust decreases with each hop
        # Direct path: 1.0
        # 1 relay: 0.8
        # 2 relays: 0.6
        # etc.
        if len(path) == 2:
            return 1.0  # Direct path
        
        # Trusted relays maintain higher trust
        trust = 1.0
        for node_id in path[1:-1]:  # Exclude source and destination
            node = self.nodes[node_id]
            if node.role == NodeRole.TRUSTED_RELAY:
                trust *= 0.9  # Small trust reduction
            else:
                trust *= 0.7  # Larger trust reduction
        
        return trust
    
    def distribute_key(self, source_id: str, destination_id: str,
                      key: bytes, session_id: str = None,
                      preferred_path: Optional[List[str]] = None,
                      ttl: int = 3600,
                      use_hardware: bool = False) -> Tuple[bool, NetworkKey, List[str]]:
        """
        Distribute key from source to destination through network.
        
        Args:
            source_id: Source node ID
            destination_id: Destination node ID
            session_id: Session identifier (auto-generated if None)
            preferred_path: Preferred path (if None, finds best path)
            ttl: Time to live (seconds)
            
        Returns:
            Tuple of (success, network_key, path_used)
        """
        if source_id not in self.nodes or destination_id not in self.nodes:
            return False, None, []
        
        # Generate session ID if not provided
        if session_id is None:
            session_id = hashlib.sha256(
                f"{source_id}:{destination_id}:{time.time()}".encode()
            ).hexdigest()[:16]
        
        # Find path
        if preferred_path:
            path = preferred_path
        else:
            paths = self.find_paths(source_id, destination_id)
            if not paths:
                return False, None, []
            path = paths[0].path  # Use best path
        
        # Verify path is valid
        if not self._validate_path(path):
            return False, None, []
        
        # Distribute key along path
        success = self._relay_key_along_path(path, key, session_id, use_hardware=use_hardware)
        
        if success:
            # Create network key
            network_key = NetworkKey(
                key=key,
                session_id=session_id,
                source_node=source_id,
                destination_node=destination_id,
                path=path,
                timestamp=int(time.time()),
                ttl=ttl
            )
            
            # Store at destination
            self.distributed_keys[session_id] = network_key
            self.nodes[destination_id].keys[session_id] = key
            
            return True, network_key, path
        
        return False, None, []
    
    def _validate_path(self, path: List[str]) -> bool:
        """Validate that path exists and has shared secrets"""
        if len(path) < 2:
            return False
        
        # Check all links exist
        for i in range(len(path) - 1):
            node1 = self.nodes[path[i]]
            node2 = self.nodes[path[i + 1]]
            
            # Check if nodes are neighbors
            if path[i + 1] not in node1.neighbors:
                return False
            
            # Check if shared secret exists
            if not node1.has_shared_secret(path[i + 1]):
                return False
        
        return True
    
    def _relay_key_along_path(self, path: List[str], key: bytes, 
                              session_id: str, use_hardware: bool = False) -> bool:
        """
        Relay key along path using QKD protocol.
        
        For each hop:
        1. Source/Relay generates QKD key with next hop (using real QKD if enabled)
        2. XORs key with QKD key
        3. Sends to next hop
        4. Next hop recovers key using QKD key
        
        This ensures each hop only sees encrypted key, not plaintext.
        
        Args:
            path: Path through network
            key: Key to distribute
            session_id: Session identifier
            use_hardware: If True, use real quantum hardware for QKD
            
        Returns:
            True if successful
        """
        current_key = key
        
        # Process each hop
        for i in range(len(path) - 1):
            node1_id = path[i]
            node2_id = path[i + 1]
            
            # Generate QKD key for this hop
            # Uses real QKD protocol if enabled
            hop_key = self._generate_hop_key(
                node1_id, 
                node2_id, 
                f"{session_id}_hop_{i}",
                use_hardware=use_hardware
            )
            
            # Encrypt key with hop key
            encrypted_key = self._xor_encrypt(current_key, hop_key)
            
            # Store encrypted key at intermediate node (if relay)
            if i < len(path) - 2:  # Not last hop
                relay_node = self.nodes[path[i + 1]]
                relay_node.keys[f"{session_id}_encrypted"] = encrypted_key
            
            # Decrypt at next node
            current_key = self._xor_decrypt(encrypted_key, hop_key)
        
        return True
    
    def _generate_hop_key(self, node1_id: str, node2_id: str, 
                         session_id: str, use_hardware: bool = False) -> bytes:
        """
        Generate QKD key for hop between two nodes.
        
        Uses real QKD protocol if available, otherwise falls back to
        deterministic key derivation from shared secret.
        
        Args:
            node1_id: First node ID
            node2_id: Second node ID
            session_id: Session identifier
            use_hardware: If True, use real quantum hardware
            
        Returns:
            QKD key (32 bytes)
        """
        if self.use_real_qkd and QKD_AVAILABLE:
            # Use real QKD protocol
            # Note: In a real network, both nodes would run QKD protocol
            # For now, we simulate by generating key at one node
            if node1_id == self.node_id and node2_id in self.qkd_protocols:
                qkd_protocol = self.qkd_protocols[node2_id]
                
                # Generate quantum key
                try:
                    key, _ = qkd_protocol.generate_quantum_key(use_hardware=use_hardware)
                    return key[:32]  # Ensure 32 bytes
                except Exception as e:
                    print(f"⚠️  QKD key generation failed: {e}, falling back to key derivation")
                    # Fall through to key derivation
            elif node2_id == self.node_id and node1_id in self.qkd_protocols:
                qkd_protocol = self.qkd_protocols[node1_id]
                
                # Generate quantum key
                try:
                    key, _ = qkd_protocol.generate_quantum_key(use_hardware=use_hardware)
                    return key[:32]  # Ensure 32 bytes
                except Exception as e:
                    print(f"⚠️  QKD key generation failed: {e}, falling back to key derivation")
                    # Fall through to key derivation
        
        # Fallback: deterministic key derivation
        shared_secret = self.nodes[node1_id].shared_secrets[node2_id]
        key_material = f"{node1_id}:{node2_id}:{session_id}".encode()
        return hashlib.sha256(shared_secret + key_material).digest()[:32]
    
    def _xor_encrypt(self, data: bytes, key: bytes) -> bytes:
        """XOR encryption"""
        return bytes(a ^ b for a, b in zip(data, (key * (len(data) // len(key) + 1))[:len(data)]))
    
    def _xor_decrypt(self, data: bytes, key: bytes) -> bytes:
        """XOR decryption (same as encryption)"""
        return self._xor_encrypt(data, key)
    
    def get_key(self, session_id: str) -> Optional[bytes]:
        """Get distributed key by session ID"""
        if session_id in self.distributed_keys:
            network_key = self.distributed_keys[session_id]
            if not network_key.is_expired():
                return network_key.key
        return None
    
    def get_network_topology(self) -> Dict:
        """Get network topology information"""
        return {
            'nodes': {
                node_id: {
                    'role': node.role.value,
                    'address': node.address,
                    'neighbors': list(node.neighbors)
                }
                for node_id, node in self.nodes.items()
            },
            'edges': [
                {
                    'source': edge[0],
                    'target': edge[1],
                    'latency': self.network_graph.get_edge_data(edge[0], edge[1]).get('latency', 1.0)
                }
                for edge in self.network_graph.edges()
            ],
            'graph': {
                'nodes': len(self.nodes),
                'edges': len(self.network_graph.edges()),
                'connected': nx.is_connected(self.network_graph)
            }
        }


# Convenience functions
def create_network_qkd(node_id: str, role: NodeRole, address: str = "",
                       use_real_qkd: bool = True, backend_name: str = "ibm_fez") -> NetworkQKD:
    """
    Create network QKD instance.
    
    Args:
        node_id: Unique node identifier
        role: Node role (source, destination, relay)
        address: Network address
        use_real_qkd: If True, use real QKD protocol for key generation
        backend_name: IBM Quantum backend name (if using real QKD)
        
    Returns:
        NetworkQKD instance
    """
    return NetworkQKD(
        node_id=node_id, 
        role=role, 
        address=address,
        use_real_qkd=use_real_qkd,
        backend_name=backend_name
    )

