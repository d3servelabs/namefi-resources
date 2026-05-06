/**
 * Record
 */
export interface Record {
  recordName: string;
  recordTtl: number;
  recordClass: string;
  recordType: string;
  rdata: string;
}

/**
 * DNSKEY record
 */
export interface DnskeyRecord extends Record {
  flags: number;
  algorithm: number;
  protocol: number;
  publicKey: string;
}

/**
 * Parse DNSKEY record from a string
 *
 * @param record - The DNSKEY record to parse
 * @returns The parsed DNSKEY record
 */

export function parseDnskeyRecord(record: string): DnskeyRecord {
  const parts = record.split(/[\s\t]+/);

  if (parts.length < 5) {
    throw new Error('Invalid DNSKEY record format: insufficient parts');
  }

  const recordName = parts[0];
  const recordTtl = Number.parseInt(parts[1]);
  const recordClass = parts[2];
  const recordType = parts[3];
  const rdata = parts.slice(4).join(' ');

  if (Number.isNaN(recordTtl)) {
    throw new Error('Invalid TTL value in DNSKEY record');
  }

  const rdataParts = rdata.split(/[\s\t]+/);
  const flags = Number.parseInt(rdataParts[0]);
  const protocol = Number.parseInt(rdataParts[1]);
  const algorithm = Number.parseInt(rdataParts[2]);
  const publicKey = rdataParts.slice(3).join('');

  if (Number.isNaN(flags)) {
    throw new Error('Invalid flags value in DNSKEY record');
  }

  if (Number.isNaN(protocol)) {
    throw new Error('Invalid protocol value in DNSKEY record');
  }

  if (Number.isNaN(algorithm)) {
    throw new Error('Invalid algorithm value in DNSKEY record');
  }

  if (protocol !== 3) {
    throw new Error('Invalid protocol value in DNSKEY record');
  }

  return {
    recordName,
    recordTtl,
    recordClass,
    recordType,
    rdata,
    flags,
    algorithm,
    protocol,
    publicKey,
  };
}
