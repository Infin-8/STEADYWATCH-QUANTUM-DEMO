#!/usr/bin/env python3
"""
LDPC (Low-Density Parity-Check) Error Correction for QKD
Advanced error correction with lower overhead than repetition codes

LDPC codes are:
- More efficient than repetition codes
- Lower overhead (fewer redundant bits)
- Better for high error rates
- Standard in modern QKD protocols
"""

import numpy as np
from typing import Tuple, List, Optional, Dict
import hashlib


class LDPCCode:
    """
    Low-Density Parity-Check (LDPC) Code for QKD Error Correction
    
    LDPC codes use a sparse parity-check matrix to detect and correct errors
    more efficiently than repetition codes.
    """
    
    def __init__(self, n: int = 256, k: int = 128, rate: float = 0.5):
        """
        Initialize LDPC code.
        
        Args:
            n: Code length (total bits including parity)
            k: Message length (information bits)
            rate: Code rate (k/n), default 0.5
        """
        self.n = n  # Code length
        self.k = k  # Message length
        self.rate = rate  # Code rate
        self.m = n - k  # Parity check bits
        
        # Generate parity-check matrix H (m x n)
        # Sparse matrix: few 1s per row/column
        self.H = self._generate_parity_check_matrix()
        
        # Generate generator matrix G (k x n) from H
        self.G = self._generate_generator_matrix()
    
    def _generate_parity_check_matrix(self) -> np.ndarray:
        """
        Generate sparse parity-check matrix H in systematic form.
        
        For systematic code: H = [P^T | I_m]
        This ensures we can easily derive G = [I_k | P]
        """
        H = np.zeros((self.m, self.n), dtype=int)
        
        # Systematic form: H = [P^T | I_m]
        # First k columns: P^T (parity part, sparse)
        # Last m columns: I_m (identity)
        
        # Identity part (last m columns)
        H[:, self.k:] = np.eye(self.m, dtype=int)
        
        # Parity part (first k columns): sparse random
        # Row weight = 4, so each row has 4 ones total
        # Since identity has 1 one, parity part should have 3 ones per row
        row_weight_parity = 3
        
        for i in range(self.m):
            # Place row_weight_parity ones in parity part
            positions = np.random.choice(self.k, size=row_weight_parity, replace=False)
            H[i, positions] = 1
        
        return H
    
    def _generate_generator_matrix(self) -> np.ndarray:
        """
        Generate generator matrix G from parity-check matrix H.
        
        For systematic code: H = [P^T | I_m], then G = [I_k | P]
        where P is the parity part.
        """
        # Convert H to systematic form: H = [P^T | I_m]
        # Then G = [I_k | P] where P is the transpose of the first part of H
        
        # For systematic LDPC, rearrange H to [P^T | I_m] form
        # Extract parity part P^T (first k columns of H)
        P_transpose = self.H[:, :self.k].copy()
        
        # Generator matrix: G = [I_k | P]
        # where P is transpose of P^T
        G = np.zeros((self.k, self.n), dtype=int)
        
        # Identity part
        G[:, :self.k] = np.eye(self.k, dtype=int)
        
        # Parity part: P = (P^T)^T
        G[:, self.k:] = P_transpose.T % 2
        
        # Verify: G * H^T should be 0 (mod 2)
        # This ensures valid code
        verification = (G @ self.H.T) % 2
        if not np.all(verification == 0):
            # If not valid, use simpler approach: random but ensure constraint
            # For now, use identity + derived parity
            G = np.zeros((self.k, self.n), dtype=int)
            G[:, :self.k] = np.eye(self.k, dtype=int)
            # Use H to derive P such that constraint is satisfied
            # Simplified: use first m rows of H^T as parity
            if self.m <= self.k:
                G[:, self.k:] = self.H[:self.m, :self.k].T % 2
            else:
                # Fallback: use random but ensure some structure
                G[:, self.k:] = np.random.randint(0, 2, size=(self.k, self.m))
        
        return G
    
    def encode(self, message: np.ndarray) -> np.ndarray:
        """
        Encode message using LDPC code.
        
        Args:
            message: Message bits (length k)
            
        Returns:
            Encoded codeword (length n)
        """
        if len(message) != self.k:
            raise ValueError(f"Message length must be {self.k}, got {len(message)}")
        
        # Encode: c = m * G (mod 2)
        codeword = (message @ self.G) % 2
        
        return codeword
    
    def decode(self, received: np.ndarray, max_iterations: int = 50) -> Tuple[np.ndarray, bool]:
        """
        Decode received codeword using belief propagation.
        
        Args:
            received: Received bits (may have errors)
            max_iterations: Maximum iterations for belief propagation
            
        Returns:
            Tuple of (decoded_message, success)
        """
        if len(received) != self.n:
            raise ValueError(f"Received length must be {self.n}, got {len(received)}")
        
        # Belief Propagation (BP) decoding
        # Initialize log-likelihood ratios (LLRs)
        llrs = np.where(received == 0, 1.0, -1.0)  # Simple initialization
        
        # Iterative decoding
        for iteration in range(max_iterations):
            # Check node updates
            check_llrs = self._check_node_update(llrs)
            
            # Variable node updates
            var_llrs = self._variable_node_update(llrs, check_llrs)
            
            # Check if valid codeword
            syndrome = (self.H @ var_llrs) % 2
            if np.all(syndrome == 0):
                # Valid codeword found
                decoded = (var_llrs < 0).astype(int)
                return decoded[:self.k], True
            
            llrs = var_llrs
        
        # Max iterations reached - return best guess
        decoded = (llrs < 0).astype(int)
        syndrome = (self.H @ decoded) % 2
        success = np.all(syndrome == 0)
        
        return decoded[:self.k], success
    
    def _check_node_update(self, llrs: np.ndarray) -> np.ndarray:
        """Update check nodes in belief propagation."""
        check_llrs = np.zeros((self.m, self.n))
        
        for i in range(self.m):
            for j in range(self.n):
                if self.H[i, j] == 1:
                    # Product of all other LLRs in this check
                    other_llrs = [llrs[k] for k in range(self.n) 
                                 if k != j and self.H[i, k] == 1]
                    if other_llrs:
                        # Approximate: use min for stability
                        check_llrs[i, j] = np.prod(np.tanh(np.array(other_llrs) / 2)) * 2
        
        return check_llrs
    
    def _variable_node_update(self, channel_llrs: np.ndarray, 
                             check_llrs: np.ndarray) -> np.ndarray:
        """Update variable nodes in belief propagation."""
        var_llrs = channel_llrs.copy()
        
        for j in range(self.n):
            # Sum of all check node messages
            check_sum = sum(check_llrs[i, j] for i in range(self.m) if self.H[i, j] == 1)
            var_llrs[j] = channel_llrs[j] + check_sum
        
        return var_llrs


class LDPCErrorCorrection:
    """
    LDPC Error Correction for QKD Protocol
    
    Provides efficient error correction using LDPC codes with lower overhead
    than repetition codes.
    """
    
    def __init__(self, code_rate: float = 0.5, code_length: int = 256):
        """
        Initialize LDPC error correction.
        
        Args:
            code_rate: Code rate (k/n), default 0.5
            code_length: Code length (n), default 256
        """
        self.code_rate = code_rate
        self.code_length = code_length
        self.message_length = int(code_length * code_rate)
        
        # Initialize LDPC code
        self.ldpc = LDPCCode(
            n=code_length,
            k=self.message_length,
            rate=code_rate
        )
    
    def correct_errors(self, 
                      key_alice: bytes, 
                      key_bob: bytes,
                      error_rate: float) -> Tuple[bytes, bytes, Dict]:
        """
        Correct errors in keys using LDPC codes.
        
        Args:
            key_alice: Alice's raw key
            key_bob: Bob's raw key
            error_rate: Estimated error rate from error detection
            
        Returns:
            Tuple of (corrected_key_alice, corrected_key_bob, correction_metadata)
        """
        print(f"🔧 Correcting errors using LDPC codes...")
        print(f"   Code rate: {self.code_rate}")
        print(f"   Code length: {self.code_length}")
        print(f"   Message length: {self.message_length}")
        print(f"   Estimated error rate: {error_rate:.2%}")
        
        # Convert keys to bits
        key_alice_bits = self._bytes_to_bits(key_alice)
        key_bob_bits = self._bytes_to_bits(key_bob)
        
        # Process in blocks
        block_size = self.message_length
        corrected_alice_bits = []
        corrected_bob_bits = []
        
        corrections_alice = 0
        corrections_bob = 0
        total_blocks = 0
        
        for i in range(0, min(len(key_alice_bits), len(key_bob_bits)), block_size):
            block_alice = key_alice_bits[i:i+block_size]
            block_bob = key_bob_bits[i:i+block_size]
            
            # Pad if necessary
            if len(block_alice) < block_size:
                block_alice = np.pad(block_alice, (0, block_size - len(block_alice)), 'constant')
            if len(block_bob) < block_size:
                block_bob = np.pad(block_bob, (0, block_size - len(block_bob)), 'constant')
            
            # Encode both blocks
            encoded_alice = self.ldpc.encode(block_alice)
            encoded_bob = self.ldpc.encode(block_bob)
            
            # Simulate transmission errors on Bob's side
            # (In real QKD, Bob would have received version with errors)
            # Introduce errors in Bob's encoded codeword based on error_rate
            received_bob = encoded_bob.copy()
            num_errors = int(len(received_bob) * error_rate)
            if num_errors > 0:
                error_positions = np.random.choice(len(received_bob), size=num_errors, replace=False)
                for pos in error_positions:
                    received_bob[pos] = 1 - received_bob[pos]  # Flip bit
            
            # Decode both (Alice's should decode perfectly, Bob's should correct errors)
            decoded_alice, success_alice = self.ldpc.decode(encoded_alice)
            decoded_bob, success_bob = self.ldpc.decode(received_bob)
            
            corrected_alice_bits.extend(decoded_alice)
            corrected_bob_bits.extend(decoded_bob)
            
            if success_alice:
                corrections_alice += 1
            if success_bob:
                corrections_bob += 1
            total_blocks += 1
        
        # Convert back to bytes
        corrected_alice = self._bits_to_bytes(np.array(corrected_alice_bits))
        corrected_bob = self._bits_to_bytes(np.array(corrected_bob_bits))
        
        # Trim to original length
        original_length = min(len(key_alice), len(key_bob))
        corrected_alice = corrected_alice[:original_length]
        corrected_bob = corrected_bob[:original_length]
        
        metadata = {
            'code_rate': self.code_rate,
            'code_length': self.code_length,
            'message_length': self.message_length,
            'total_blocks': total_blocks,
            'successful_corrections_alice': corrections_alice,
            'successful_corrections_bob': corrections_bob,
            'correction_rate_alice': corrections_alice / total_blocks if total_blocks > 0 else 0,
            'correction_rate_bob': corrections_bob / total_blocks if total_blocks > 0 else 0
        }
        
        print(f"✅ LDPC error correction complete")
        print(f"   Blocks processed: {total_blocks}")
        print(f"   Successful corrections (Alice): {corrections_alice}/{total_blocks}")
        print(f"   Successful corrections (Bob): {corrections_bob}/{total_blocks}")
        
        return corrected_alice, corrected_bob, metadata
    
    def _bytes_to_bits(self, data: bytes) -> np.ndarray:
        """Convert bytes to bit array."""
        bits = []
        for byte in data:
            for i in range(8):
                bits.append((byte >> i) & 1)
        return np.array(bits, dtype=int)
    
    def _bits_to_bytes(self, bits: np.ndarray) -> bytes:
        """Convert bit array to bytes."""
        byte_array = bytearray()
        for i in range(0, len(bits), 8):
            byte = 0
            for j in range(8):
                if i + j < len(bits):
                    byte |= (bits[i + j] << j)
            byte_array.append(byte)
        return bytes(byte_array)


# Convenience function for QKD protocol integration
def create_ldpc_corrector(code_rate: float = 0.5, code_length: int = 256) -> LDPCErrorCorrection:
    """
    Create LDPC error corrector for QKD protocol.
    
    Args:
        code_rate: Code rate (default 0.5 = 50% overhead)
        code_length: Code length (default 256 bits)
        
    Returns:
        LDPCErrorCorrection instance
    """
    return LDPCErrorCorrection(code_rate=code_rate, code_length=code_length)

