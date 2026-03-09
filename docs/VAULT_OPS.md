# THE VAULT™ — Operations and Compliance

This document covers key custody, rotation, backup/recovery, and regulatory considerations for THE VAULT™ product layer. It assumes the vault backend (81-slot key store, store/request API) and SHQKD/Echo Resonance key material are in place.

## Key custody

- **Key material source:** Production key material should be supplied by SHQKD (or the existing QKD API), not derived from a static seed. The vault API should accept key injection per slot or bulk and must not log raw key material.
- **Storage:** Keys must be stored in a secure enclave or HSM-backed store where possible. In-memory key store (as in the demo) is acceptable only for development; production requires encrypted persistence and access controls.
- **Access:** Only the vault service process should have read access to the key store. API keys used to authenticate clients must be hashed and not stored in plaintext.

## Key rotation

- **Rotation policy:** Define a rotation schedule (e.g. per-slot keys rotated every N days, or on demand). After rotation, re-encrypt any payloads in that slot with the new key and retire the old key.
- **SHQKD integration:** New key material can be requested from the QKD pipeline for the rotated slot; the vault backend then replaces the slot key and re-encrypts stored payloads for that slot.
- **Audit:** Log all rotation events (slot, timestamp, reason) in the audit log.

## Backup and recovery

- **Key store backup:** Backups of the key store must be encrypted and stored in a separate secure location. Restore procedures must be documented and tested.
- **Payload backup:** Encrypted payloads (ciphertext) can be backed up like any other data; ensure backup keys are not the same as the 81 slot keys where avoidable, or use a separate backup encryption layer.
- **Recovery:** Document recovery steps for loss of a slot key (payload in that slot may be unrecoverable unless a key backup exists) and for full vault restore.

## Regulatory and compliance

- **Data classification:** Classify vault contents (e.g. credentials, wallets, PII) and apply the appropriate data-handling and retention policies.
- **Financial services:** If the vault holds keys or data used in financial transactions, consider PCI-DSS, SOC 2, or local financial regulations. Key release and access logs should support compliance audits.
- **Health data:** If used for healthcare data, ensure HIPAA or equivalent requirements are met (access control, audit trails, encryption at rest and in transit).
- **Audit trail:** The vault API audit log (store, request, and optionally rotation) must be retained according to policy and be available for auditors. Consider immutable append-only storage for the audit log.

## Production checklist

- [ ] Replace demo key derivation with SHQKD/Echo key injection.
- [ ] Persist key store and encrypted payloads with encryption and access control.
- [ ] Use HSM or secure enclave for key storage where available.
- [ ] Hash or otherwise secure API keys; support rotation of API keys.
- [ ] Define and implement key rotation and re-encryption for slots.
- [ ] Document and test backup and recovery procedures.
- [ ] Retain and protect audit logs; define retention period.
- [ ] Apply regulatory requirements relevant to vault contents (financial, health, etc.).
