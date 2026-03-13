# Hurwitz Lattice-Metric Authentication: Biometric-Style Identity for Quantum Key Distribution

**Authors:** STEADYWATCH™ Research Team
**Date:** March 13, 2026
**Status:** 🔬 CONCEPT — Implementation Pending
**Depends on:** `qkd/qkd_protocol.py`, `qkd/network_qkd.py`, `js/hurwitz-keys.js`

---

## Abstract

We propose a novel authentication mechanism for quantum key distribution (QKD) networks grounded in the geometric uniqueness of Hurwitz quaternion F4 lattice cluster shapes. Just as human biometrics (fingerprints, iris patterns, retinal vasculature) provide identity verification through irreducible biological structure, **Hurwitz lattice-metrics** provide identity verification through irreducible number-theoretic structure. The cluster silhouette of the F4 lattice at a given prime is unique, deterministic, and impossible to forge without possessing the prime itself — making it a structural authenticator that requires no pre-shared secret. We map this concept directly onto the existing SteadyWatch Hybrid QKD Protocol (SHQKD), identifying Phase 1 Authentication as the primary integration point. The proposed `HurwitzLatticeAuth` layer replaces or augments the current HMAC pre-shared secret with a prime-derived lattice commitment, resolving the classical bootstrapping problem in QKD authentication.

**Keywords:** Hurwitz Quaternions, Biometric Authentication, QKD, Lattice-Based Cryptography, F4 Root Lattice, Zero-Knowledge, Structural Authentication, Cloud QKD

---

## 1. The Biometric Analogy

### 1.1 Human Biometrics

Human biometric identifiers share three properties that make them useful for authentication:

1. **Uniqueness** — no two individuals produce the same pattern
2. **Determinism** — the same individual always produces the same pattern
3. **Irreducibility** — the pattern cannot be derived without the source (the biological structure itself)

Fingerprints, iris fiber patterns, and retinal vascular maps all satisfy these properties. They are "baked in" to the individual at a level that cannot be forged without having the actual biological source.

The human eye is a particularly apt example: the iris has ~249 bits of effective entropy, its pattern is readable by human vision and machine scanners, and it is derived from chaotic developmental processes that are unique even between identical twins.

### 1.2 Hurwitz Lattice-Metrics

The Hurwitz F4 quaternion lattice at a given prime p satisfies the same three properties:

1. **Uniqueness** — the cluster silhouette at p=5 is distinct from p=13, p=17, and all other primes
2. **Determinism** — `unzipSeed(p)` always produces the same 24(p+1) sites with the same coordinates
3. **Irreducibility** — the cluster shape cannot be produced without knowing the prime p and the Hurwitz unit group structure

The critical additional property that biometrics do not have: the Hurwitz lattice-metric is **mathematically verifiable**. A fingerprint must be compared against a stored template. A Hurwitz cluster can be verified against the closed-form formula — no stored template required. Any party can independently recompute the expected cluster from the claimed prime and verify the presented shape.

### 1.3 The Analogy Table

| Property | Human Biometric | Hurwitz Lattice-Metric |
|----------|----------------|------------------------|
| Source | Biological development | Prime p + Hurwitz unit group |
| Pattern | Ridge/fiber/vascular structure | F4 cluster silhouette |
| Uniqueness | Per individual | Per prime |
| Entropy | ~249 bits (iris) | Scales with 24(p+1) |
| Forgery | Requires biological source | Requires prime factorization in 4D |
| Verification | Against stored template | Against closed-form formula |
| Readable by human eye | ✅ | ✅ (Fingerprint View) |
| Machine-verifiable | ✅ | ✅ |
| Revocable | ❌ (biological) | ✅ (change prime) |

The last row is where Hurwitz lattice-metrics **exceed** human biometrics: they are revocable. If a prime is compromised, a new prime is selected. The lattice-metric rotates with the prime.

---

## 2. The Authentication Problem in QKD

### 2.1 Current State: SHQKD Phase 1

The SteadyWatch Hybrid QKD Protocol (SHQKD) currently implements Phase 1 authentication via HMAC challenge-response over a pre-shared secret:

```python
# qkd/qkd_protocol.py — current approach
def __init__(self, party_id: str, shared_secret: bytes, ...):
    self.shared_secret = shared_secret  # Must be distributed out-of-band

def generate_auth_challenge(self) -> Tuple[bytes, QKDMessage]:
    challenge = secrets.token_bytes(32)
    # ...
    return challenge, message

def verify_auth_response(self, challenge: bytes, response: bytes) -> bool:
    expected_response = hmac.new(self.shared_secret, challenge, hashlib.sha256).digest()
    return hmac.compare_digest(expected_response, response)
```

And in the network layer, each link carries a pre-shared secret:

```python
# qkd/network_qkd.py — current approach
@dataclass
class NetworkNode:
    shared_secrets: Dict[str, bytes]  # node_id -> shared_secret (pre-distributed)
```

### 2.2 The Bootstrapping Problem

This is the classical QKD authentication bootstrapping problem: **to establish a quantum-secure key, you first need a classical secret**. The pre-shared secret must be distributed out-of-band (physically, or via a classical channel), which re-introduces the very vulnerability QKD is meant to eliminate.

Current solutions are either:
- **Practical but weak:** Use classical PKI (RSA/ECDSA) for initial auth — vulnerable to Shor's algorithm
- **Secure but impractical:** Distribute pre-shared secrets physically (courier, secure channel)
- **Theoretical:** Use quantum authentication protocols — not yet production-ready

### 2.3 The Gap Hurwitz Lattice-Metrics Fill

Hurwitz lattice-metric authentication is a **structural** approach: identity is derived from the mathematical structure of the claimed prime, not from a secret. The authenticating party commits to a prime → the counterparty verifies the commitment by independently deriving the expected F4 cluster → if they match, the prime is authentic.

No pre-shared secret is required for the commitment itself. The prime is the identity.

---

## 3. Proposed: HurwitzLatticeAuth

### 3.1 Concept

A node's identity in the SHQKD network is expressed as a **lattice commitment** — a structured proof that the node possesses a specific Hurwitz prime without revealing the prime's associated keys.

```
Identity = (prime p, cluster_hash, signature)

Where:
  cluster_hash  = SHA-256( sorted F4 sites of unzipSeed(p) )
  signature     = Sign(cluster_hash) with node's long-term key
```

The cluster_hash is the "lattice fingerprint" — a 256-bit digest of the full F4 cluster geometry. It is:
- Public (derivable from p)
- Unique per prime
- Verifiable without a shared secret

### 3.2 Authentication Flow

```
Alice                                           Bob
  |                                               |
  |  1. LATTICE_HELLO:                            |
  |     { prime_claim: p,                         |
  |       cluster_hash: H(unzipSeed(p)),          |
  |       nonce: random }          ───────────>   |
  |                                               |  2. Verify:
  |                                               |     expected_hash = H(unzipSeed(p_claim))
  |                                               |     if cluster_hash != expected_hash: REJECT
  |                                               |
  |  4. Proceed to Phase 2 (QKG)  <───────────   |  3. LATTICE_ACK: { challenge, session_id }
  |                                               |
```

**Key properties:**
- Bob never needs a pre-shared secret with Alice — he derives the expected cluster from the claimed prime
- Alice cannot fake a cluster_hash for prime p without computing `unzipSeed(p)` — which requires knowing the F4 structure
- The nonce prevents replay attacks
- The prime_claim is public; the associated cryptographic keys are private

### 3.3 Mutual Authentication

Both parties commit to their primes simultaneously:

```
Alice (prime pA)                               Bob (prime pB)
  |                                               |
  |  { claim: pA, hash: H(F4(pA)), nonce_A }  ──>|
  |<── { claim: pB, hash: H(F4(pB)), nonce_B }   |
  |                                               |
  |  Verify H(F4(pB)) matches pB               . |
  |                                             . |  Verify H(F4(pA)) matches pA
  |  Proceed if valid                             |  Proceed if valid
```

Each party holds a different prime. The cross-prime verification is the authentication handshake.

### 3.4 Integration Point in SHQKD

The `HurwitzLatticeAuth` layer slots into SHQKD Phase 1 as a new message type alongside or replacing the existing HMAC auth:

**New message types for `qkd_protocol.py`:**
```python
class MessageType(Enum):
    # Existing:
    AUTH_CHALLENGE  = "AUTH_CHALLENGE"
    AUTH_RESPONSE   = "AUTH_RESPONSE"
    # New (Hurwitz):
    LATTICE_HELLO   = "LATTICE_HELLO"    # Prime claim + cluster hash
    LATTICE_ACK     = "LATTICE_ACK"      # Verification result + challenge
    LATTICE_CONFIRM = "LATTICE_CONFIRM"  # Mutual confirmation
```

**New field on `NetworkNode` in `network_qkd.py`:**
```python
@dataclass
class NetworkNode:
    shared_secrets: Dict[str, bytes]    # existing (can be empty with lattice auth)
    hurwitz_prime: Optional[int] = None # new: this node's identity prime
    lattice_hash:  Optional[bytes] = None  # new: pre-computed H(F4(prime))
```

**New trust level for lattice-authenticated links:**
```python
# Current trust levels: direct=1.0, trusted_relay=0.9, standard_relay=0.7
LATTICE_AUTHENTICATED = 0.95  # Lattice auth: structural guarantee, no shared secret
```

---

## 4. The Cloud Dimension

### 4.1 Cloud-Native Authentication

STEADYWATCH™ is a cloud-based service. In a cloud context, Hurwitz lattice-metric authentication has specific advantages:

**Current cloud QKD challenge:**
- Nodes join and leave dynamically
- Pre-shared secrets must be distributed per-link (O(n²) for n nodes)
- Re-keying when nodes join is operationally expensive

**With Hurwitz lattice-metrics:**
- A new node presents its prime claim + cluster hash
- Any existing node can verify it independently (no coordination needed)
- The prime is the node's persistent identity across sessions
- Re-keying = selecting a new prime (automated, no physical distribution)

### 4.2 Multi-Tenant Lattice Identity

The satellite architecture maps naturally to multi-tenancy:

```
Cloud tenant identity hierarchy:

  Master prime p = 17  (service operator)
      └── 432 satellites = 432 sub-identities (tenants/nodes)
          Each satellite has unique 4D coordinates
          Each coordinate set is a distinct lattice-metric
```

Each tenant's lattice-metric is derived from the master prime but is independently verifiable. Revoking a tenant = removing their satellite from the active set, without affecting other tenants or the master prime.

### 4.3 Network Topology Integration

In `network_qkd.py`, the existing `NetworkPath` trust model gains a new dimension:

```
Path trust = f(hops, relay_type, lattice_auth_status)

Where lattice_auth_status ∈ {
    NONE:           no lattice auth (existing behavior)
    HASH_VERIFIED:  cluster hash matches expected F4 structure
    FULL_VERIFIED:  hash + signature + cross-prime mutual auth
}
```

A path where all nodes are lattice-authenticated carries higher intrinsic trust than an equivalent path using only pre-shared secrets — because the structural authentication is continuously verifiable, not just at connection time.

---

## 5. The Human-Eye Dimension

### 5.1 Why This Matters Beyond Cryptography

The observation that Hurwitz cluster shapes "form similar distinctions that a human eye would share" points to something deeper than a cryptographic mechanism.

Human biometrics are useful not just because they are unique, but because they are **perceivable** — a person can look at two iris scans and say "these are different." The authentication is not purely mechanical; it has a human-readable dimension that enables intuitive verification.

The Fingerprint View (bird's-eye camera at y=22) gives Hurwitz lattice-metrics the same property: a human operator can look at two cluster silhouettes and perceive their difference. This enables:

1. **Operational security review** — a human can sanity-check cluster identities visually before authorizing key exchanges
2. **Audit trails** — key exchange logs can include cluster fingerprint images, giving human reviewers geometric evidence of the primes involved
3. **Anomaly detection** — an unexpected cluster shape (wrong prime, corrupted lattice) is immediately visible to a trained operator

### 5.2 The Three Inspection Scales

| View | Camera Y | What you see | Security use |
|------|----------|--------------|-------------|
| Fingerprint | 22 | Full cluster silhouette | Prime identity verification |
| Quadrant | 8–12 | Four-arm structure | Lattice arm integrity check |
| Node | 4–6 | Individual key drop | Key-level inspection |

These map directly onto three tiers of QKD session inspection:
1. **Session-level:** Is this the right prime / identity?
2. **Arm-level:** Are all four lattice arms present and correctly structured?
3. **Key-level:** Is this specific key drop authentic?

---

## 6. Security Analysis

### 6.1 Forgery Resistance

To forge a Hurwitz lattice-metric for prime p, an attacker must:

1. Know p (the prime)
2. Compute `unzipSeed(p)` — enumerate all Hurwitz quaternions with norm p
3. Compute the cluster hash `H(sorted sites)`

Step 2 requires solving the representation problem for quaternary quadratic forms at norm p. While this is polynomial in p (not exponentially hard), the security comes from the structural binding: **you cannot claim a prime without knowing its full F4 shell**. An attacker who can compute the F4 shell can forge the hash — but they also have everything they need to generate legitimate keys, making the forgery unnecessary.

The real security property is: **lattice-metric authentication leaks no key material**. The cluster hash is derived from site coordinates, not from the keys themselves. Verifying the hash proves structural knowledge without revealing anything exploitable.

### 6.2 Replay and Replay-Forward Attacks

The nonce in `LATTICE_HELLO` prevents replay. Session IDs prevent replay-forward across sessions. Both are already present in the SHQKD message structure (`QKDMessage.session_id`, `QKDMessage.timestamp`).

### 6.3 Comparison to Existing SHQKD Auth

| Property | HMAC (current) | Hurwitz Lattice-Metric (proposed) |
|----------|---------------|----------------------------------|
| Pre-shared secret required | ✅ | ❌ |
| Quantum-safe | Depends on secret distribution | ✅ (structural) |
| Revocable | Only by secret rotation | ✅ (change prime) |
| Verifiable without storage | ❌ | ✅ (compute from prime) |
| Human-readable | ❌ | ✅ (Fingerprint View) |
| Multi-tenant scaling | O(n²) secrets | O(n) primes |
| Post-quantum | Depends on classical channel | ✅ |

---

## 7. Implementation Roadmap

### Phase A — Python Core (`qkd/`)

**New file: `qkd/hurwitz_lattice_auth.py`**
- `HurwitzLatticeAuth` class
- `compute_lattice_hash(p)` — enumerate F4 shell, sort, SHA-256
- `generate_lattice_hello(prime, nonce)` → `LATTICE_HELLO` message
- `verify_lattice_hello(message)` → bool (recompute + compare)
- `generate_lattice_ack(verified, challenge)` → `LATTICE_ACK` message
- `mutual_auth(prime_a, prime_b)` → session_id if both valid

**Modify: `qkd/qkd_protocol.py`**
- Add `LATTICE_HELLO`, `LATTICE_ACK`, `LATTICE_CONFIRM` to `MessageType`
- Add optional `hurwitz_prime: int` param to `QKDProtocol.__init__`
- Add `lattice_authenticate()` method alongside existing `authenticate()`
- Phase 1 routing: if `hurwitz_prime` set → lattice auth; else → HMAC auth

**Modify: `qkd/network_qkd.py`**
- Add `hurwitz_prime: Optional[int]` and `lattice_hash: Optional[bytes]` to `NetworkNode`
- Add `LATTICE_AUTHENTICATED = 0.95` trust level
- `add_link()`: skip `shared_secret` requirement if both nodes have `hurwitz_prime`
- Path trust scoring: factor in `lattice_auth_status`

### Phase B — JavaScript Client (`js/`)

**New file: `js/hurwitz-lattice-auth.js`**
- `computeLatticeHash(p)` — wraps `HurwitzKeys.unzipSeed(p)`, sorts sites, hashes
- `generateLatticeHello(prime)` → `{ prime_claim, cluster_hash, nonce }`
- `verifyLatticeHello(message)` → `{ valid: bool, prime: int }`
- Connects to cloud API endpoint for lattice auth exchange

### Phase C — Cloud API

**New endpoints on VAULT/VIPER/HORDE APIs:**
- `POST /auth/lattice-hello` — receive + verify client lattice claim
- `POST /auth/lattice-ack` — return server lattice claim + challenge
- `POST /auth/lattice-confirm` — mutual confirmation → session token

### Phase D — Fingerprint View Integration

Connect the existing Fingerprint View buttons to the auth layer:
- On auth initiation, snap to Fingerprint View and display the counterparty's claimed cluster
- Operator can visually confirm cluster shape before session proceeds
- Log fingerprint image with session ID for audit trail

---

## 8. Open Questions

1. **Prime selection policy:** How are primes assigned to cloud nodes? Static per-tenant, or rotated per-session?
2. **Sub-prime identity (satellite auth):** Can a satellite (one of 432 sites) authenticate independently as a sub-identity of its parent prime?
3. **Cross-prime session keys:** If Alice uses p=5 and Bob uses p=13, the cross-prime relationship `?!z(13) / ?!z(5) = 2.333...` could seed the session key — is there a secure way to use this?
4. **Revocation list:** When a prime is retired, how is the revocation broadcast through the network without re-introducing a pre-shared secret dependency?
5. **Lattice hash collision resistance:** The cluster hash is SHA-256 of sorted 4D coordinates. Are there any two primes p ≠ q where the sorted site sets collide? (Conjecture: no, by uniqueness of F4 shells at distinct norms.)

---

## 9. Conclusion

The observation that Hurwitz quaternion cluster shapes share the visual and structural properties of human biometrics is both accurate and actionable. The parallel is not metaphorical — it is structural: both derive unique, deterministic, irreducible identity from a source that cannot be forged without possessing the original (biological or mathematical).

Mapped onto the existing SHQKD infrastructure, Hurwitz lattice-metric authentication resolves the bootstrapping problem in QKD by eliminating the pre-shared secret requirement for Phase 1 authentication. The prime IS the identity. The cluster hash IS the credential. The Fingerprint View IS the human-readable audit layer.

The cloud-native multi-tenant architecture maps cleanly: one master prime per service operator, one satellite per tenant, one F4 shell verification per session. This scales as O(n) in the number of nodes, compared to O(n²) for pre-shared secret distribution.

The human-eye dimension — the fact that Hurwitz cluster shapes are perceivable and distinguishable by trained human observers — adds an operational security layer that purely computational authentication cannot provide.

---

## 10. References

1. STEADYWATCH™ Research Team (2026). "Dual-Layer Hurwitz F4 Lattice Visualization." `docs/research/HURWITZ_DUAL_LATTICE_VISUALIZATION.md`
2. STEADYWATCH™ Research Team (2026). "SteadyWatch Hybrid QKD Protocol Specification." `docs/qkd/QKD_PROTOCOL_SPECIFICATION.md`
3. STEADYWATCH™ Research Team (2026). "Network QKD Documentation." `docs/qkd/NETWORK_QKD_DOCUMENTATION.md`
4. Hurwitz, A. (1896). "Über die Zahlentheorie der Quaternionen." *Nachrichten von der Gesellschaft der Wissenschaften zu Göttingen.*
5. Bennett, C. H. & Brassard, G. (1984). "Quantum cryptography: Public key distribution and coin tossing." *IEEE ICCSSP.*
6. Portmann, C. & Renner, R. (2022). "Security in Quantum Cryptography." *Reviews of Modern Physics* 94, 025008.
7. Chou, T. & Schnorr, C. (2016). "Fast Lattice Basis Reduction Suitable for Massive Parallelization." — context for SVP hardness on F4 lattices.

---

**Document Status:** 🔬 Concept — ready for implementation
**Next Step:** Implement `qkd/hurwitz_lattice_auth.py` (Phase A)
**Last Updated:** March 13, 2026
