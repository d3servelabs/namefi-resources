import { createHash } from 'node:crypto';
import { DIGEST_TYPE, DNSKEY_FLAGS, getDigestTypeName } from './consts';
import { dnskeyToRdata } from './dnskeyToRdata';
import { domainToWireFormat } from './domainToWireFormat';

/**
 * Compute DS digest (SHA-256 or SHA-1)
 */
export function computeDsDigest(
  domain: string,
  flags: number,
  protocol: number,
  algorithm: number,
  publicKey: string,
  digestType: DIGEST_TYPE = DIGEST_TYPE.sha256,
): string {
  // Validate inputs
  if (!domain || domain.trim().length === 0) {
    throw new Error('Domain is required');
  }
  if (!publicKey || publicKey.trim().length === 0) {
    throw new Error('Public key is required');
  }
  if (protocol !== 3) {
    throw new Error('Protocol must be 3 for DNSSEC');
  }
  const digestTypeName = getDigestTypeName(digestType);
  if (!digestTypeName) {
    throw new Error('Invalid digest type');
  }
  const nameWire = domainToWireFormat(domain);
  const rdataWire = dnskeyToRdata(flags, protocol, algorithm, publicKey);
  const data = Buffer.concat([nameWire, rdataWire]);

  const hash = createHash(digestTypeName);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Get DS record from key
 */
export function getDsRecordFromKey(
  _domain: string,
  pubkey: string,
  keyTag: number,
  algorithm = 13, // ECDSA P-256 with SHA-256
  protocol = 3,
  ttl = 3600,
  flags: DNSKEY_FLAGS = DNSKEY_FLAGS.KSK,
  digestType: DIGEST_TYPE = DIGEST_TYPE.sha256,
) {
  // Validate inputs
  if (keyTag < 0 || keyTag > 65535) {
    throw new Error('Key tag must be between 0 and 65535');
  }
  if (ttl < 0) {
    throw new Error('TTL cannot be negative');
  }
  const domain = _domain.replace(/\.$/g, '');
  const dsDigest = computeDsDigest(
    domain,
    flags,
    protocol,
    algorithm,
    pubkey,
    digestType,
  );

  const rdata = `${keyTag} ${algorithm} ${digestType} ${dsDigest}`;
  const recordType = 'DS';
  const recordClass = 'IN';
  const recordName = `${domain}.`;
  const recordTtl = ttl;
  const recordParts = [recordName, recordTtl, recordClass, recordType, rdata];

  return recordParts.join('\t');
}
