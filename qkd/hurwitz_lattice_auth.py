#!/usr/bin/env python3
"""
Hurwitz Lattice-Metric Authentication (HLA)
Biometric-style structural authentication for QKD networks.

Each node's identity is derived from a Hurwitz prime p — the F4 lattice
shell at norm p is unique per prime, deterministic, and verifiable by any
party without a pre-shared secret. The cluster hash commits to the prime's
full lattice geometry and serves as the authentication credential.

Protocol:
  1. Claimant sends LATTICE_HELLO  { prime_claim, cluster_hash, nonce }
  2. Verifier recomputes expected_hash = H(F4_shell(prime_claim))
  3. If match: send LATTICE_ACK { session_id, challenge }
  4. Mutual: both sides verify each other's cluster hash

Reference: docs/research/HURWITZ_LATTICE_BIOMETRIC_AUTHENTICATION.md
"""

import hashlib
import math
import secrets
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Hurwitz F4 Shell Generator (Python port of js/hurwitz-keys.js)
# ---------------------------------------------------------------------------

def _generate_24_units() -> List[Tuple]:
    """Generate the 24 Hurwitz unit quaternions."""
    units = set()
    # 8 integer units: ±1 along each axis
    for axis in range(4):
        for sign in (1, -1):
            q = [0, 0, 0, 0]
            q[axis] = sign
            units.add(tuple(q))
    # 16 half-integer units: (±½, ±½, ±½, ±½)
    for sa in (1, -1):
        for sb in (1, -1):
            for sc in (1, -1):
                for sd in (1, -1):
                    units.add((sa * 0.5, sb * 0.5, sc * 0.5, sd * 0.5))
    return list(units)[:24]


def _quat_multiply(q: Tuple, u: Tuple) -> Tuple:
    """Multiply two Hurwitz quaternions."""
    a = q[0]*u[0] - q[1]*u[1] - q[2]*u[2] - q[3]*u[3]
    b = q[0]*u[1] + q[1]*u[0] + q[2]*u[3] - q[3]*u[2]
    c = q[0]*u[2] - q[1]*u[3] + q[2]*u[0] + q[3]*u[1]
    d = q[0]*u[3] + q[1]*u[2] - q[2]*u[1] + q[3]*u[0]
    # Round to nearest half-integer
    a = round(a * 2) / 2
    b = round(b * 2) / 2
    c = round(c * 2) / 2
    d = round(d * 2) / 2
    return (a, b, c, d)


def _norm(q: Tuple) -> float:
    return q[0]**2 + q[1]**2 + q[2]**2 + q[3]**2


def generate_f4_shell(p: int) -> List[Tuple[float, float, float, float]]:
    """
    Generate all Hurwitz quaternion sites with norm = p.
    Returns sorted list of (a, b, c, d) tuples.

    Count: 24*(p+1) for split primes (p ≡ 1 mod 4).
    Mirrors js/hurwitz-keys.js generateHurwitzPrimesNormP().
    """
    if p == 2:
        return _generate_f4_shell_norm2()

    solutions = set()
    max_val = int(math.sqrt(p)) + 1

    # Integer-coordinate solutions
    for a in range(-max_val, max_val + 1):
        for b in range(-max_val, max_val + 1):
            for c in range(-max_val, max_val + 1):
                d_sq = p - a*a - b*b - c*c
                if d_sq < 0:
                    continue
                d = int(math.isqrt(d_sq))
                if d * d == d_sq:
                    solutions.add((float(a), float(b), float(c), float(d)))
                    if d != 0:
                        solutions.add((float(a), float(b), float(c), float(-d)))

    # Half-integer-coordinate solutions
    for a2 in range(-max_val * 2, max_val * 2 + 1):
        a = a2 / 2
        if a == int(a):  # skip integers, handled above
            continue
        for b2 in range(-max_val * 2, max_val * 2 + 1):
            b = b2 / 2
            if b == int(b):
                continue
            for c2 in range(-max_val * 2, max_val * 2 + 1):
                c = c2 / 2
                if c == int(c):
                    continue
                d_sq = p - a*a - b*b - c*c
                if d_sq < 0:
                    continue
                d2 = round(math.sqrt(d_sq * 4))
                d = d2 / 2
                if abs(a*a + b*b + c*c + d*d - p) < 0.001:
                    solutions.add((a, b, c, d))
                    solutions.add((a, b, c, -d))

    # Expand by Hurwitz units (right-multiplication by each of 24 units)
    units = _generate_24_units()
    seen = set()
    sites = []
    for sol in solutions:
        for u in units:
            r = _quat_multiply(sol, u)
            if abs(_norm(r) - p) < 0.01 and r not in seen:
                seen.add(r)
                sites.append(r)

    return sorted(sites)


def _generate_f4_shell_norm2() -> List[Tuple]:
    """Special case: p=2 shell generation."""
    seen = set()
    sites = []
    # All integer and half-integer quaternions with norm=2
    for a2 in range(-4, 5):
        for b2 in range(-4, 5):
            for c2 in range(-4, 5):
                for d2 in range(-4, 5):
                    a, b, c, d = a2/2, b2/2, c2/2, d2/2
                    if abs(_norm((a, b, c, d)) - 2) < 0.01:
                        q = (a, b, c, d)
                        if q not in seen:
                            seen.add(q)
                            sites.append(q)
    return sorted(sites)


# ---------------------------------------------------------------------------
# Lattice Hash
# ---------------------------------------------------------------------------

def compute_lattice_hash(p: int) -> bytes:
    """
    Compute the lattice fingerprint hash for prime p.

    H = SHA-256( canonical encoding of sorted F4 shell sites )

    This hash is:
    - Unique per prime (F4 shell is distinct at each norm)
    - Deterministic (same prime always produces same hash)
    - Public (derivable from p by any party)
    - Commitment to the full lattice geometry
    """
    sites = generate_f4_shell(p)
    # Canonical encoding: sorted tuples, each component as fixed-precision string
    canonical = ";".join(
        f"{a:.4f},{b:.4f},{c:.4f},{d:.4f}" for (a, b, c, d) in sites
    )
    return hashlib.sha256(canonical.encode()).digest()


# ---------------------------------------------------------------------------
# Protocol Messages
# ---------------------------------------------------------------------------

@dataclass
class LatticeHello:
    """
    Phase 1 auth message: claimant presents prime identity.
    Sent by both Alice and Bob simultaneously in mutual auth.
    """
    prime_claim: int
    cluster_hash: bytes     # SHA-256 of F4 shell = lattice fingerprint
    nonce: bytes            # Random 32 bytes (anti-replay)
    party_id: str
    timestamp: int = field(default_factory=lambda: int(time.time()))

    def to_dict(self) -> Dict:
        return {
            "type": "LATTICE_HELLO",
            "prime_claim": self.prime_claim,
            "cluster_hash": self.cluster_hash.hex(),
            "nonce": self.nonce.hex(),
            "party_id": self.party_id,
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, d: Dict) -> "LatticeHello":
        return cls(
            prime_claim=d["prime_claim"],
            cluster_hash=bytes.fromhex(d["cluster_hash"]),
            nonce=bytes.fromhex(d["nonce"]),
            party_id=d["party_id"],
            timestamp=d.get("timestamp", 0),
        )


@dataclass
class LatticeAck:
    """
    Phase 1 auth response: verifier confirms lattice claim is valid.
    Includes a challenge for the next step and the verifier's own claim.
    """
    session_id: str
    verified: bool
    challenge: bytes        # 32-byte challenge for key exchange bootstrap
    verifier_prime: int
    verifier_hash: bytes
    verifier_nonce: bytes
    timestamp: int = field(default_factory=lambda: int(time.time()))

    def to_dict(self) -> Dict:
        return {
            "type": "LATTICE_ACK",
            "session_id": self.session_id,
            "verified": self.verified,
            "challenge": self.challenge.hex(),
            "verifier_prime": self.verifier_prime,
            "verifier_hash": self.verifier_hash.hex(),
            "verifier_nonce": self.verifier_nonce.hex(),
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, d: Dict) -> "LatticeAck":
        return cls(
            session_id=d["session_id"],
            verified=d["verified"],
            challenge=bytes.fromhex(d["challenge"]),
            verifier_prime=d["verifier_prime"],
            verifier_hash=bytes.fromhex(d["verifier_hash"]),
            verifier_nonce=bytes.fromhex(d["verifier_nonce"]),
            timestamp=d.get("timestamp", 0),
        )


@dataclass
class LatticeConfirm:
    """
    Phase 1 auth final: mutual confirmation, session established.
    """
    session_id: str
    mutual_verified: bool
    session_seed: bytes     # XOR of both cluster hashes = shared session seed
    timestamp: int = field(default_factory=lambda: int(time.time()))

    def to_dict(self) -> Dict:
        return {
            "type": "LATTICE_CONFIRM",
            "session_id": self.session_id,
            "mutual_verified": self.mutual_verified,
            "session_seed": self.session_seed.hex(),
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, d: Dict) -> "LatticeConfirm":
        return cls(
            session_id=d["session_id"],
            mutual_verified=d["mutual_verified"],
            session_seed=bytes.fromhex(d["session_seed"]),
            timestamp=d.get("timestamp", 0),
        )


# ---------------------------------------------------------------------------
# HurwitzLatticeAuth
# ---------------------------------------------------------------------------

class HurwitzLatticeAuth:
    """
    Hurwitz Lattice-Metric Authentication.

    Replaces / augments Phase 1 HMAC auth in QKDProtocol with structural
    authentication derived from Hurwitz quaternion F4 lattice geometry.
    No pre-shared secret required — the prime IS the identity.

    Usage (Alice side):
        auth = HurwitzLatticeAuth(party_id="alice", prime=5)
        hello = auth.generate_hello()           # Send to Bob
        ack = ...                               # Receive from Bob
        confirm = auth.process_ack(ack)         # Verify Bob, send confirm
        session_seed = confirm.session_seed     # Use to bootstrap QKD

    Usage (Bob side):
        auth = HurwitzLatticeAuth(party_id="bob", prime=13)
        hello_from_alice = ...                  # Receive from Alice
        ack = auth.verify_and_ack(hello_from_alice)  # Verify Alice, send ack
        confirm_from_alice = ...                # Receive from Alice
        session_seed = confirm_from_alice.session_seed
    """

    # Trust level for lattice-authenticated links (vs. 1.0 direct, 0.9 trusted_relay)
    TRUST_LEVEL = 0.95

    # Cache: prime -> cluster_hash (computed once, reused)
    _hash_cache: Dict[int, bytes] = {}

    def __init__(self, party_id: str, prime: int):
        """
        Args:
            party_id: Node identifier (e.g. "alice", "node-us-east-1")
            prime:    Hurwitz prime defining this node's lattice identity
                      Supported: 2, 5, 13, 17 (and any p ≡ 1 mod 4)
        """
        self.party_id = party_id
        self.prime = prime
        self.session_id: Optional[str] = None
        self._local_nonce: Optional[bytes] = None
        self._peer_hash: Optional[bytes] = None

        # Pre-compute this node's cluster hash
        self.cluster_hash = self._get_cluster_hash(prime)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_hello(self) -> LatticeHello:
        """
        Generate LATTICE_HELLO — present this node's prime identity.
        Call this first, send result to the peer.
        """
        self._local_nonce = secrets.token_bytes(32)
        return LatticeHello(
            prime_claim=self.prime,
            cluster_hash=self.cluster_hash,
            nonce=self._local_nonce,
            party_id=self.party_id,
        )

    def verify_and_ack(self, hello: LatticeHello) -> Tuple[bool, Optional[LatticeAck]]:
        """
        Verify a peer's LATTICE_HELLO and generate LATTICE_ACK.

        Returns:
            (verified, ack_message)
            verified=False means the claimed prime does not match the hash — reject.
        """
        verified = self._verify_hello(hello)
        if not verified:
            return False, None

        self._peer_hash = hello.cluster_hash
        self.session_id = secrets.token_hex(16)

        ack = LatticeAck(
            session_id=self.session_id,
            verified=True,
            challenge=secrets.token_bytes(32),
            verifier_prime=self.prime,
            verifier_hash=self.cluster_hash,
            verifier_nonce=secrets.token_bytes(32),
        )
        return True, ack

    def process_ack(self, ack: LatticeAck) -> Tuple[bool, Optional[LatticeConfirm]]:
        """
        Process a LATTICE_ACK from the peer (Alice processes Bob's ack).
        Verifies the peer's own lattice claim embedded in the ack,
        then produces a LATTICE_CONFIRM with shared session seed.

        Returns:
            (mutual_verified, confirm_message)
        """
        if not ack.verified:
            return False, None

        # Verify peer's own claim in the ack
        peer_hello = LatticeHello(
            prime_claim=ack.verifier_prime,
            cluster_hash=ack.verifier_hash,
            nonce=ack.verifier_nonce,
            party_id="peer",
        )
        peer_ok = self._verify_hello(peer_hello)
        if not peer_ok:
            return False, None

        self._peer_hash = ack.verifier_hash
        self.session_id = ack.session_id

        # Session seed: XOR of both cluster hashes
        # Neither party can control this unilaterally (both hashes contribute)
        session_seed = bytes(a ^ b for a, b in zip(self.cluster_hash, ack.verifier_hash))

        confirm = LatticeConfirm(
            session_id=self.session_id,
            mutual_verified=True,
            session_seed=session_seed,
        )
        return True, confirm

    def derive_session_seed(self, peer_cluster_hash: bytes) -> bytes:
        """
        Derive a shared session seed from two cluster hashes.
        This is the primitive used by process_ack — exposed for direct use
        when integrating with NetworkQKD link establishment.

        The seed is deterministic: same two primes always produce the same seed.
        Both parties can compute it independently without exchanging the seed itself.
        """
        return bytes(a ^ b for a, b in zip(self.cluster_hash, peer_cluster_hash))

    def get_trust_level(self) -> float:
        """Trust level for links authenticated via this mechanism."""
        return self.TRUST_LEVEL

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _verify_hello(self, hello: LatticeHello) -> bool:
        """Verify cluster_hash matches the expected F4 shell for prime_claim."""
        expected = self._get_cluster_hash(hello.prime_claim)
        return hashlib.compare_digest(expected, hello.cluster_hash)

    @classmethod
    def _get_cluster_hash(cls, p: int) -> bytes:
        """Compute (or retrieve cached) cluster hash for prime p."""
        if p not in cls._hash_cache:
            cls._hash_cache[p] = compute_lattice_hash(p)
        return cls._hash_cache[p]


# ---------------------------------------------------------------------------
# Network helper: lattice link (no pre-shared secret needed)
# ---------------------------------------------------------------------------

@dataclass
class LatticeLink:
    """
    A network link authenticated via Hurwitz lattice-metrics.
    Replaces the (node1, node2, shared_secret) tuple in NetworkQKD.add_link().
    """
    node1_id: str
    node2_id: str
    node1_prime: int
    node2_prime: int
    session_seed: bytes         # Derived from XOR of cluster hashes
    trust_level: float = HurwitzLatticeAuth.TRUST_LEVEL
    established_at: int = field(default_factory=lambda: int(time.time()))

    @classmethod
    def establish(cls, node1_id: str, node1_prime: int,
                  node2_id: str, node2_prime: int) -> "LatticeLink":
        """
        Establish a lattice-authenticated link between two nodes.
        Both primes must be known; the session seed is derived structurally.
        No out-of-band secret distribution required.
        """
        hash1 = compute_lattice_hash(node1_prime)
        hash2 = compute_lattice_hash(node2_prime)
        session_seed = bytes(a ^ b for a, b in zip(hash1, hash2))
        return cls(
            node1_id=node1_id,
            node2_id=node2_id,
            node1_prime=node1_prime,
            node2_prime=node2_prime,
            session_seed=session_seed,
        )

    def get_shared_secret(self) -> bytes:
        """
        Return session seed as a shared_secret-compatible bytes object.
        Allows LatticeLink to drop into existing NetworkQKD.add_link() calls
        as a structural replacement for pre-shared secrets.
        """
        return self.session_seed


# ---------------------------------------------------------------------------
# Convenience
# ---------------------------------------------------------------------------

def create_lattice_auth(party_id: str, prime: int) -> HurwitzLatticeAuth:
    """Create a HurwitzLatticeAuth instance."""
    return HurwitzLatticeAuth(party_id=party_id, prime=prime)


def supported_primes() -> List[int]:
    """Return the primes currently used in STEADYWATCH game environments."""
    return [5, 13, 17]


def prime_site_count(p: int) -> int:
    """Expected F4 site count for prime p: 24*(p+1) for split primes."""
    return 24 * (p + 1)
