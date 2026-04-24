import { describe, expect, it } from 'vitest';
import { dnskeyToRdata } from '../dnskeyToRdata';

describe('dnskeyToRdata', () => {
  it('should convert DNSKEY parameters to correct RDATA wire format', () => {
    const flags = 257; // KSK flag
    const protocol = 3; // Standard value for DNSKEY records
    const algorithm = 13; // ECDSAP256SHA256
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const rdata = dnskeyToRdata(flags, protocol, algorithm, publicKey);

    // First 4 bytes should be:
    // Flags (2 bytes, 0x0101 = 257)
    // Protocol (1 byte, 0x03)
    // Algorithm (1 byte, 0x0D = 13)
    const expectedHeader = new Uint8Array([0x01, 0x01, protocol, algorithm]);

    // Check that the header bytes are correct
    expect(Array.from(rdata.slice(0, 4))).toEqual(Array.from(expectedHeader));

    // Check that the whole buffer has the correct length
    // 4 bytes header + the public key decoded from base64
    const decodedPublicKey = Buffer.from(publicKey, 'base64');
    expect(rdata.length).toBe(4 + decodedPublicKey.length);
  });

  it('should handle public keys with whitespace', () => {
    const flags = 256; // ZSK flag
    const protocol = 3;
    const algorithm = 8; // RSA/SHA-256
    // Public key with some whitespace
    const publicKey = 'AQPj5B7C DFG3Fhx4 HJmgMg==';

    const rdata = dnskeyToRdata(flags, protocol, algorithm, publicKey);

    // First 4 bytes should match flags, protocol, algorithm
    const expectedHeader = new Uint8Array([0x01, 0x00, protocol, algorithm]);

    expect(Array.from(rdata.slice(0, 4))).toEqual(Array.from(expectedHeader));

    // The whitespace in the public key should be removed before base64 decoding
    const decodedPublicKey = Buffer.from(
      publicKey.replace(/\s+/g, ''),
      'base64',
    );
    expect(rdata.length).toBe(4 + decodedPublicKey.length);
  });

  it('rejects out-of-range integer fields', () => {
    const publicKey = 'AQPj5B7CDFG3Fhx4HJmgMg==';

    expect(() => dnskeyToRdata(70_000, 3, 13, publicKey)).toThrow(
      'Flags must be an integer between 0 and 65535',
    );
    expect(() => dnskeyToRdata(257, 256, 13, publicKey)).toThrow(
      'Protocol must be an integer between 0 and 255',
    );
    expect(() => dnskeyToRdata(257, 3, -1, publicKey)).toThrow(
      'Algorithm must be an integer between 0 and 255',
    );
  });
});
