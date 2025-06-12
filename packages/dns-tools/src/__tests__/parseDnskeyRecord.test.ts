import { describe, expect, it } from 'vitest';
import { parseDnskeyRecord } from '../parseDnskeyRecord';

describe('parseDnskeyRecord', () => {
  it('should correctly parse a standard DNSKEY record', () => {
    const record =
      'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });

  it('should handle records with tab separators', () => {
    const record =
      'example.com.\t3600\tIN\tDNSKEY\t257\t3\t13\tg2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });

  it('should handle records with mixed separators', () => {
    const record =
      'example.com. 3600 IN DNSKEY\t257 3\t13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });
});
