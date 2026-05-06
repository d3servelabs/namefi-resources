import type { Record } from './parseDnskeyRecord';

const WHITESPACE_REGEX = /[\s\t]+/;
const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * DS record (RFC 4034 §5)
 */
export interface DsRecord extends Record {
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
}

/**
 * Parse a DS record from a zone-file line.
 *
 * Accepts the canonical zone-file format
 * `name TTL IN DS keyTag algorithm digestType digest` and tolerates
 * whitespace inside the digest (as `dig` and many provider UIs split
 * long digests across multiple tokens).
 */
export function parseDsRecord(record: string): DsRecord {
  const parts = record
    .split(WHITESPACE_REGEX)
    .filter((token) => token.length > 0);

  if (parts.length < 5) {
    throw new Error('Invalid DS record format: insufficient parts');
  }

  const recordName = parts[0];
  const recordTtl = Number.parseInt(parts[1]);
  const recordClass = parts[2];
  const recordType = parts[3];
  const rdata = parts.slice(4).join(' ');

  if (Number.isNaN(recordTtl)) {
    throw new Error('Invalid TTL value in DS record');
  }
  if (recordType !== 'DS') {
    throw new Error('Not a DS record');
  }

  const rdataParts = rdata
    .split(WHITESPACE_REGEX)
    .filter((token) => token.length > 0);
  if (rdataParts.length < 4) {
    throw new Error(
      'Invalid DS rdata: expected keyTag algorithm digestType digest',
    );
  }
  const keyTag = Number.parseInt(rdataParts[0]);
  const algorithm = Number.parseInt(rdataParts[1]);
  const digestType = Number.parseInt(rdataParts[2]);
  const digest = rdataParts.slice(3).join('');

  if (Number.isNaN(keyTag) || keyTag < 0 || keyTag > 0xffff) {
    throw new Error('Invalid keyTag in DS record (must be 0-65535)');
  }
  if (Number.isNaN(algorithm) || algorithm < 0 || algorithm > 0xff) {
    throw new Error('Invalid algorithm in DS record');
  }
  if (Number.isNaN(digestType) || digestType < 0 || digestType > 0xff) {
    throw new Error('Invalid digestType in DS record');
  }
  if (!HEX_REGEX.test(digest)) {
    throw new Error('Invalid digest in DS record (must be hex)');
  }

  return {
    recordName,
    recordTtl,
    recordClass,
    recordType,
    rdata,
    keyTag,
    algorithm,
    digestType,
    digest,
  };
}
