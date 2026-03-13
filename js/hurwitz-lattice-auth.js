/**
 * Hurwitz Lattice-Metric Authentication (HLA) — Browser Client
 *
 * Biometric-style structural authentication for QKD networks.
 * Each node's identity is derived from a Hurwitz prime p — the F4 lattice
 * shell at norm p is unique per prime, deterministic, and verifiable by any
 * party without a pre-shared secret.
 *
 * Depends on: js/hurwitz-keys.js (window.HurwitzKeys.unzipSeed)
 * Exposes:    window.HurwitzLatticeAuth
 *
 * Reference: docs/research/HURWITZ_LATTICE_BIOMETRIC_AUTHENTICATION.md
 */
(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Canonical encoding — must exactly match Python:
    //   ";".join(f"{a:.4f},{b:.4f},{c:.4f},{d:.4f}" for (a,b,c,d) in sorted(sites))
    // ------------------------------------------------------------------

    function toFixed4(n) {
        // Matches Python's f"{n:.4f}" — always 4 decimal places, negative sign preserved
        return n.toFixed(4);
    }

    function siteKey(q) {
        return toFixed4(q.a) + ',' + toFixed4(q.b) + ',' + toFixed4(q.c) + ',' + toFixed4(q.d);
    }

    function compareSites(qa, qb) {
        // Lexicographic sort matching Python's tuple sort: a, then b, then c, then d
        if (qa.a !== qb.a) return qa.a < qb.a ? -1 : 1;
        if (qa.b !== qb.b) return qa.b < qb.b ? -1 : 1;
        if (qa.c !== qb.c) return qa.c < qb.c ? -1 : 1;
        if (qa.d !== qb.d) return qa.d < qb.d ? -1 : 1;
        return 0;
    }

    function canonicalString(sites) {
        var sorted = sites.slice().sort(compareSites);
        var parts = [];
        for (var i = 0; i < sorted.length; i++) {
            parts.push(siteKey(sorted[i]));
        }
        return parts.join(';');
    }

    // ------------------------------------------------------------------
    // SHA-256 via Web Crypto API (async)
    // ------------------------------------------------------------------

    function sha256(str) {
        var encoded = new TextEncoder().encode(str);
        return crypto.subtle.digest('SHA-256', encoded).then(function (buf) {
            return new Uint8Array(buf);
        });
    }

    function bytesToHex(bytes) {
        var hex = '';
        for (var i = 0; i < bytes.length; i++) {
            hex += ('00' + bytes[i].toString(16)).slice(-2);
        }
        return hex;
    }

    function hexToBytes(hex) {
        var bytes = new Uint8Array(hex.length / 2);
        for (var i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    function randomHex(byteLen) {
        var buf = new Uint8Array(byteLen);
        crypto.getRandomValues(buf);
        return bytesToHex(buf);
    }

    // ------------------------------------------------------------------
    // Lattice hash — core primitive
    // computeLatticeHash(p) → Promise<string>  (64-char hex)
    // ------------------------------------------------------------------

    // Cache so each prime is only hashed once per page load
    var _hashCache = {};

    function computeLatticeHash(prime) {
        if (_hashCache[prime]) {
            return Promise.resolve(_hashCache[prime]);
        }
        if (!window.HurwitzKeys) {
            return Promise.reject(new Error('HurwitzKeys not loaded — include hurwitz-keys.js first'));
        }
        var sites = window.HurwitzKeys.unzipSeed(prime);
        var canonical = canonicalString(sites);
        return sha256(canonical).then(function (bytes) {
            var hex = bytesToHex(bytes);
            _hashCache[prime] = hex;
            return hex;
        });
    }

    // ------------------------------------------------------------------
    // XOR session seed from two hex cluster hashes
    // ------------------------------------------------------------------

    function xorHashes(hexA, hexB) {
        var a = hexToBytes(hexA);
        var b = hexToBytes(hexB);
        var out = new Uint8Array(a.length);
        for (var i = 0; i < a.length; i++) {
            out[i] = a[i] ^ b[i];
        }
        return bytesToHex(out);
    }

    // ------------------------------------------------------------------
    // LatticeAuth — per-session auth instance
    // ------------------------------------------------------------------

    /**
     * LatticeAuth(partyId, prime, apiBase)
     *
     * @param {string} partyId  — this node's identifier (e.g. "client-alice")
     * @param {number} prime    — Hurwitz prime for this node's lattice identity (5, 13, or 17)
     * @param {string} apiBase  — base URL of the QKD API (e.g. "http://localhost:5003")
     */
    function LatticeAuth(partyId, prime, apiBase) {
        this.partyId = partyId;
        this.prime = prime;
        this.apiBase = (apiBase || '').replace(/\/$/, '');
        this._localNonce = null;
        this._localHash = null;
        this.sessionId = null;
        this.sessionSeed = null;
    }

    /**
     * generateHello() → Promise<object>
     * Build a LATTICE_HELLO payload for this node.
     * Call this first, then send the result to the peer / API.
     */
    LatticeAuth.prototype.generateHello = function () {
        var self = this;
        self._localNonce = randomHex(32);
        return computeLatticeHash(self.prime).then(function (hash) {
            self._localHash = hash;
            return {
                type: 'LATTICE_HELLO',
                prime_claim: self.prime,
                cluster_hash: hash,
                nonce: self._localNonce,
                party_id: self.partyId,
                timestamp: Math.floor(Date.now() / 1000)
            };
        });
    };

    /**
     * verifyHello(hello) → Promise<boolean>
     * Verify a peer's LATTICE_HELLO by recomputing their expected cluster hash.
     */
    LatticeAuth.prototype.verifyHello = function (hello) {
        return computeLatticeHash(hello.prime_claim).then(function (expected) {
            return expected === hello.cluster_hash;
        });
    };

    /**
     * processAck(ack) → Promise<{ mutualVerified: bool, sessionSeed: string }>
     * Verify the peer's own lattice claim embedded in their LATTICE_ACK,
     * then derive the shared session seed.
     */
    LatticeAuth.prototype.processAck = function (ack) {
        var self = this;
        if (!ack.verified) {
            return Promise.resolve({ mutualVerified: false, sessionSeed: null });
        }
        // Verify peer's own claim returned in the ack
        return computeLatticeHash(ack.verifier_prime).then(function (expected) {
            if (expected !== ack.verifier_hash) {
                return { mutualVerified: false, sessionSeed: null };
            }
            self.sessionId = ack.session_id;
            // Session seed: XOR of both cluster hashes
            var seed = xorHashes(self._localHash, ack.verifier_hash);
            self.sessionSeed = seed;
            return { mutualVerified: true, sessionSeed: seed };
        });
    };

    // ------------------------------------------------------------------
    // Full mutual auth via API  (Phases C endpoints)
    // ------------------------------------------------------------------

    /**
     * authenticate() → Promise<{ success: bool, sessionId: string, sessionSeed: string }>
     *
     * Full round-trip against the cloud API:
     *   1. POST /auth/lattice-hello  — send our hello, receive server's ack
     *   2. Verify server's lattice claim in the ack
     *   3. POST /auth/lattice-confirm — confirm mutual auth, receive session
     */
    LatticeAuth.prototype.authenticate = function () {
        var self = this;
        return self.generateHello().then(function (hello) {
            return fetch(self.apiBase + '/auth/lattice-hello', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hello)
            });
        }).then(function (res) {
            if (!res.ok) throw new Error('lattice-hello rejected: ' + res.status);
            return res.json();
        }).then(function (ack) {
            return self.processAck(ack).then(function (result) {
                if (!result.mutualVerified) throw new Error('Server lattice claim failed verification');
                return fetch(self.apiBase + '/auth/lattice-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: self.sessionId,
                        party_id: self.partyId,
                        mutual_verified: true,
                        session_seed: result.sessionSeed
                    })
                });
            });
        }).then(function (res) {
            if (!res.ok) throw new Error('lattice-confirm rejected: ' + res.status);
            return res.json();
        }).then(function (confirm) {
            return {
                success: true,
                sessionId: self.sessionId,
                sessionSeed: self.sessionSeed
            };
        }).catch(function (err) {
            return { success: false, error: err.message, sessionId: null, sessionSeed: null };
        });
    };

    // ------------------------------------------------------------------
    // LatticeLink — derive session seed without network round-trip
    // (for same-process / same-page use: e.g. two game instances)
    // ------------------------------------------------------------------

    /**
     * LatticeLink.establish(prime1, prime2) → Promise<string>
     * Derives the shared session seed from two primes structurally.
     * Both sides can call this independently and get identical results.
     */
    function establishLatticeLink(prime1, prime2) {
        return Promise.all([
            computeLatticeHash(prime1),
            computeLatticeHash(prime2)
        ]).then(function (hashes) {
            return xorHashes(hashes[0], hashes[1]);
        });
    }

    // ------------------------------------------------------------------
    // Fingerprint — return hash as structured identity object
    // ------------------------------------------------------------------

    /**
     * getFingerprint(prime) → Promise<{ prime, hash, siteCount, shortId }>
     * Returns a structured fingerprint object for UI display / audit logging.
     */
    function getFingerprint(prime) {
        if (!window.HurwitzKeys) {
            return Promise.reject(new Error('HurwitzKeys not loaded'));
        }
        var siteCount = window.HurwitzKeys.unzipSeed(prime).length;
        return computeLatticeHash(prime).then(function (hash) {
            return {
                prime: prime,
                hash: hash,
                shortId: hash.slice(0, 12),   // First 6 bytes for display
                siteCount: siteCount,
                formula: '24 \u00d7 (' + prime + ' + 1) = ' + siteCount
            };
        });
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    window.HurwitzLatticeAuth = {
        /** Create a new auth session instance */
        create: function (partyId, prime, apiBase) {
            return new LatticeAuth(partyId, prime, apiBase);
        },

        /** Compute lattice fingerprint hash for a prime (Promise<hex string>) */
        computeHash: computeLatticeHash,

        /** Get structured fingerprint object for a prime */
        getFingerprint: getFingerprint,

        /** Derive shared session seed from two primes (no network needed) */
        establishLink: establishLatticeLink,

        /** Supported primes (matching STEADYWATCH game environments) */
        supportedPrimes: [5, 13, 17],

        /** Expected site count for a given prime */
        siteCount: function (prime) {
            return 24 * (prime + 1);
        }
    };

})();
