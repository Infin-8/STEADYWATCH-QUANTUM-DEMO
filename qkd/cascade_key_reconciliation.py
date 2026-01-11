#!/usr/bin/env python3
"""
Cascade Protocol for Key Reconciliation
Iterative binary search algorithm for efficient error location and correction

The Cascade protocol:
1. Divides key into blocks
2. Compares parity of blocks
3. Uses binary search to locate errors
4. Iteratively refines error locations
5. More efficient than simple repetition codes
"""

import numpy as np
from typing import Tuple, List, Dict, Optional
import secrets
import hashlib


class CascadeProtocol:
    """
    Cascade Protocol for Key Reconciliation
    
    An iterative error correction protocol that uses binary search
    to efficiently locate and correct errors in QKD keys.
    """
    
    def __init__(self, block_size: int = 8, num_passes: int = 4):
        """
        Initialize Cascade protocol.
        
        Args:
            block_size: Initial block size for parity comparison
            num_passes: Number of iterative passes
        """
        self.block_size = block_size
        self.num_passes = num_passes
        self.passes = []
    
    def reconcile_keys(self,
                      key_alice: bytes,
                      key_bob: bytes,
                      error_rate: float) -> Tuple[bytes, bytes, Dict]:
        """
        Reconcile keys using Cascade protocol.
        
        Process:
        1. Divide keys into blocks
        2. Compare parity of blocks
        3. Use binary search to locate errors
        4. Correct errors iteratively
        5. Repeat for multiple passes
        
        Args:
            key_alice: Alice's raw key
            key_bob: Bob's raw key
            error_rate: Estimated error rate
            
        Returns:
            Tuple of (reconciled_key_alice, reconciled_key_bob, reconciliation_metadata)
        """
        print(f"🔄 Reconciling keys using Cascade protocol...")
        print(f"   Block size: {self.block_size}")
        print(f"   Number of passes: {self.num_passes}")
        print(f"   Estimated error rate: {error_rate:.2%}")
        
        # Convert keys to bits
        key_alice_bits = self._bytes_to_bits(key_alice)
        key_bob_bits = self._bytes_to_bits(key_bob)
        
        # Ensure same length
        min_length = min(len(key_alice_bits), len(key_bob_bits))
        key_alice_bits = key_alice_bits[:min_length]
        key_bob_bits = key_bob_bits[:min_length]
        
        # Initialize reconciled keys
        reconciled_alice = key_alice_bits.copy()
        reconciled_bob = key_bob_bits.copy()
        
        # Track errors corrected
        total_errors_corrected = 0
        pass_results = []
        
        # Track which bits have been corrected (to avoid double correction)
        corrected_bits = set()
        
        # Multiple passes
        for pass_num in range(1, self.num_passes + 1):
            print(f"   Pass {pass_num}/{self.num_passes}...")
            
            # Calculate block size for this pass
            # Block size decreases with each pass for finer error location
            current_block_size = self.block_size // (2 ** (pass_num - 1))
            current_block_size = max(1, current_block_size)  # At least 1 bit
            
            # Reconcile this pass (only correct uncorrected errors)
            reconciled_alice, reconciled_bob, pass_result, new_corrected = self._reconcile_pass(
                reconciled_alice,
                reconciled_bob,
                current_block_size,
                pass_num,
                corrected_bits
            )
            
            # Update corrected bits
            corrected_bits.update(new_corrected)
            errors_corrected = len(new_corrected)
            total_errors_corrected += errors_corrected
            pass_result['errors_corrected'] = errors_corrected
            pass_results.append(pass_result)
            
            print(f"      Errors corrected: {errors_corrected}")
            
            # If no errors found, can stop early
            if errors_corrected == 0:
                print(f"      No errors found - stopping early")
                break
        
        # Convert back to bytes
        reconciled_alice_bytes = self._bits_to_bytes(reconciled_alice)
        reconciled_bob_bytes = self._bits_to_bytes(reconciled_bob)
        
        # Calculate final error rate
        remaining_errors = np.sum(reconciled_alice != reconciled_bob)
        final_error_rate = remaining_errors / len(reconciled_alice) if len(reconciled_alice) > 0 else 0.0
        
        metadata = {
            'block_size': self.block_size,
            'num_passes': self.num_passes,
            'total_errors_corrected': total_errors_corrected,
            'remaining_errors': int(remaining_errors),
            'final_error_rate': final_error_rate,
            'pass_results': pass_results,
            'keys_match': remaining_errors == 0
        }
        
        print(f"✅ Cascade reconciliation complete")
        print(f"   Total errors corrected: {total_errors_corrected}")
        print(f"   Remaining errors: {remaining_errors}")
        print(f"   Final error rate: {final_error_rate:.2%}")
        print(f"   Keys match: {remaining_errors == 0}")
        
        return reconciled_alice_bytes, reconciled_bob_bytes, metadata
    
    def _reconcile_pass(self,
                       key_alice: np.ndarray,
                       key_bob: np.ndarray,
                       block_size: int,
                       pass_num: int,
                       corrected_bits: set) -> Tuple[np.ndarray, np.ndarray, Dict, set]:
        """
        Perform one pass of Cascade reconciliation.
        
        Args:
            key_alice: Alice's key bits
            key_bob: Bob's key bits
            block_size: Block size for this pass
            pass_num: Pass number
            corrected_bits: Set of already corrected bit positions
            
        Returns:
            Tuple of (reconciled_alice, reconciled_bob, pass_result, new_corrected_bits)
        """
        reconciled_alice = key_alice.copy()
        reconciled_bob = key_bob.copy()
        
        new_corrected = set()
        blocks_processed = 0
        
        # Process in blocks
        for i in range(0, len(key_alice), block_size):
            block_end = min(i + block_size, len(key_alice))
            block_alice = reconciled_alice[i:block_end]
            block_bob = reconciled_bob[i:block_end]
            
            # Compare parity
            parity_alice = np.sum(block_alice) % 2
            parity_bob = np.sum(block_bob) % 2
            
            blocks_processed += 1
            
            # If parity differs, there's an error (or odd number of errors)
            if parity_alice != parity_bob:
                # Find all errors in this block
                error_positions = self._find_errors_in_block(
                    block_alice,
                    block_bob,
                    i,  # Offset for absolute position
                    corrected_bits
                )
                
                # Correct each error
                for error_pos in error_positions:
                    if error_pos not in corrected_bits:
                        # Correct error (flip Bob's bit to match Alice)
                        reconciled_bob[error_pos] = 1 - reconciled_bob[error_pos]
                        new_corrected.add(error_pos)
        
        pass_result = {
            'pass_num': pass_num,
            'block_size': block_size,
            'blocks_processed': blocks_processed
        }
        
        return reconciled_alice, reconciled_bob, pass_result, new_corrected
    
    def _find_errors_in_block(self,
                              block_alice: np.ndarray,
                              block_bob: np.ndarray,
                              offset: int,
                              corrected_bits: set) -> List[int]:
        """
        Find all errors in block using binary search.
        
        Handles multiple errors by recursively searching sub-blocks.
        
        Args:
            block_alice: Alice's block
            block_bob: Bob's block
            offset: Offset for absolute position
            corrected_bits: Set of already corrected bit positions
            
        Returns:
            List of error positions (absolute)
        """
        errors = []
        
        # If block is small, check all bits directly
        if len(block_alice) <= 4:
            for i in range(len(block_alice)):
                pos = offset + i
                if block_alice[i] != block_bob[i] and pos not in corrected_bits:
                    errors.append(pos)
            return errors
        
        # Check parity
        parity_alice = np.sum(block_alice) % 2
        parity_bob = np.sum(block_bob) % 2
        
        # If parity matches, no errors (or even number - will be caught in next pass)
        if parity_alice == parity_bob:
            return errors
        
        # Parity differs - use binary search to find error
        mid = len(block_alice) // 2
        
        # Search left half
        left_errors = self._find_errors_in_block(
            block_alice[:mid],
            block_bob[:mid],
            offset,
            corrected_bits
        )
        errors.extend(left_errors)
        
        # Search right half
        right_errors = self._find_errors_in_block(
            block_alice[mid:],
            block_bob[mid:],
            offset + mid,
            corrected_bits
        )
        errors.extend(right_errors)
        
        return errors
    
    def _binary_search_error(self,
                            block_alice: np.ndarray,
                            block_bob: np.ndarray,
                            offset: int) -> Optional[int]:
        """
        Use binary search to locate a single error in block.
        
        (Legacy method - kept for compatibility)
        
        Args:
            block_alice: Alice's block
            block_bob: Bob's block
            offset: Offset for absolute position
            
        Returns:
            Error position (absolute) or None if not found
        """
        errors = self._find_errors_in_block(block_alice, block_bob, offset, set())
        return errors[0] if errors else None
    
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


# Convenience function
def create_cascade_protocol(block_size: int = 8, num_passes: int = 4) -> CascadeProtocol:
    """
    Create Cascade protocol instance.
    
    Args:
        block_size: Initial block size (default 8)
        num_passes: Number of passes (default 4)
        
    Returns:
        CascadeProtocol instance
    """
    return CascadeProtocol(block_size=block_size, num_passes=num_passes)

