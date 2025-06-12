import { describe, expect, it } from 'vitest';
import { computeDsDigest, getDsRecordFromKey } from '../computeDsDigest';
import { DIGEST_TYPE, DNSKEY_FLAGS } from '../consts';

describe('computeDsDigest', () => {
  it('should compute SHA-256 digest correctly', () => {
    const domain = 'example.com';
    const flags = DNSKEY_FLAGS.KSK;
    const protocol = 3;
    const algorithm = 13;
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const digest = computeDsDigest(
      domain,
      flags,
      protocol,
      algorithm,
      publicKey,
      DIGEST_TYPE.sha256,
    );

    // This is a valid SHA-256 digest - should be 64 characters (32 bytes) hexadecimal
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(
      '3015cfdbbf046841f04767524e8d9e56a584bb0aee1ca3ac253e81a020a06af0',
    );
  });

  it('should compute SHA-1 digest correctly', () => {
    const domain = 'example.com';
    const flags = DNSKEY_FLAGS.KSK;
    const protocol = 3;
    const algorithm = 13;
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const digest = computeDsDigest(
      domain,
      flags,
      protocol,
      algorithm,
      publicKey,
      DIGEST_TYPE.sha1,
    );

    // This is a valid SHA-1 digest - should be 40 characters (20 bytes) hexadecimal
    expect(digest).toMatch(/^[0-9a-f]{40}$/);
    expect(digest).toBe('38fb469b98c9b4af71a0b1a4e40eda5836575aba');
  });

  it('should default to SHA-256 if digest type is not specified', () => {
    const domain = 'example.com';
    const flags = DNSKEY_FLAGS.KSK;
    const protocol = 3;
    const algorithm = 13;
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const digest = computeDsDigest(
      domain,
      flags,
      protocol,
      algorithm,
      publicKey,
    );

    // This is a valid SHA-256 digest - should be 64 characters hexadecimal
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(
      '3015cfdbbf046841f04767524e8d9e56a584bb0aee1ca3ac253e81a020a06af0',
    );
  });

  it('should throw an error for invalid digest type', () => {
    const domain = 'example.com';
    const flags = DNSKEY_FLAGS.KSK;
    const protocol = 3;
    const algorithm = 13;
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    // Using an invalid digest type (999) that doesn't exist in the DIGEST_TYPE enum
    expect(() =>
      computeDsDigest(
        domain,
        flags,
        protocol,
        algorithm,
        publicKey,
        999 as DIGEST_TYPE,
      ),
    ).toThrow('Invalid digest type');
  });
});

describe('getDsRecordFromKey', () => {
  it('should generate a correct DS record', () => {
    const domain = 'example.com';
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';
    const keyTag = 12345;

    const dsRecord = getDsRecordFromKey(domain, publicKey, keyTag);

    // The DS record should be a tab-separated string with:
    // domain TTL IN DS keyTag algorithm digestType digest
    const parts = dsRecord.split('\t');

    expect(parts.length).toBe(5);
    expect(parts[0]).toBe('example.com.'); // domain with trailing dot
    expect(parts[1]).toBe('3600'); // default TTL
    expect(parts[2]).toBe('IN'); // class
    expect(parts[3]).toBe('DS'); // record type

    // The RDATA should contain keyTag, algorithm, digestType, and digest
    const rdata = parts[4].split(' ');
    expect(rdata.length).toBe(4);
    expect(rdata[0]).toBe('12345'); // keyTag
    expect(rdata[1]).toBe('13'); // default algorithm
    expect(rdata[2]).toBe('2'); // default digestType (SHA-256)
    expect(rdata[3]).toMatch(/^[0-9a-f]{64}$/); // SHA-256 digest (64 hex chars)
  });

  it('should handle custom parameters', () => {
    const domain = 'example.com';
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';
    const keyTag = 12345;
    const algorithm = 8; // Different algorithm
    const protocol = 3;
    const ttl = 7200; // Custom TTL
    const flags = DNSKEY_FLAGS.ZSK; // ZSK instead of KSK
    const digestType = DIGEST_TYPE.sha1; // SHA-1 instead of SHA-256

    const dsRecord = getDsRecordFromKey(
      domain,
      publicKey,
      keyTag,
      algorithm,
      protocol,
      ttl,
      flags,
      digestType,
    );

    const parts = dsRecord.split('\t');

    expect(parts[0]).toBe('example.com.');
    expect(parts[1]).toBe('7200'); // Custom TTL

    const rdata = parts[4].split(' ');
    expect(rdata[1]).toBe('8'); // Custom algorithm
    expect(rdata[2]).toBe('1'); // SHA-1 digestType
    expect(rdata[3]).toMatch(/^[0-9a-f]{40}$/); // SHA-1 digest (40 hex chars)
  });

  it('should handle domains with trailing dot', () => {
    const domain = 'example.com.';
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';
    const keyTag = 12345;

    const dsRecord = getDsRecordFromKey(domain, publicKey, keyTag);

    const parts = dsRecord.split('\t');

    // The domain should have exactly one trailing dot
    expect(parts[0]).toBe('example.com.');
  });
});
