import { describe, expect, it } from 'vitest';
import { parseDsRecord } from '../parseDsRecord';

describe('parseDsRecord', () => {
  it('parses a canonical full DS record', () => {
    const record =
      'vibecoding.city. 3600 IN DS 36011 8 2 83E49D5079C91B23831D5D2BDFB7C62683DAED020341465485B176DD2978691B';
    const parsed = parseDsRecord(record);
    expect(parsed.recordName).toBe('vibecoding.city.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DS');
    expect(parsed.keyTag).toBe(36011);
    expect(parsed.algorithm).toBe(8);
    expect(parsed.digestType).toBe(2);
    expect(parsed.digest.toUpperCase()).toBe(
      '83E49D5079C91B23831D5D2BDFB7C62683DAED020341465485B176DD2978691B',
    );
  });

  it('tolerates whitespace inside the digest (dig-style multi-token rdata)', () => {
    const record =
      'vibecoding.city.    3600    IN    DS    36011 8 2 83E49D5079C91B23831D5D2BDFB7C62683DAED020341465485B176DD 2978691B';
    const parsed = parseDsRecord(record);
    expect(parsed.keyTag).toBe(36011);
    expect(parsed.digest.toUpperCase()).toBe(
      '83E49D5079C91B23831D5D2BDFB7C62683DAED020341465485B176DD2978691B',
    );
  });

  it('accepts lowercase hex digests', () => {
    const parsed = parseDsRecord('example.com. 3600 IN DS 12345 13 2 deadbeef');
    expect(parsed.digest).toBe('deadbeef');
  });

  it('throws when the record type is not DS', () => {
    expect(() => parseDsRecord('example.com. 3600 IN A 1.2.3.4')).toThrow(
      'Not a DS record',
    );
  });

  it('throws on non-hex digest', () => {
    expect(() =>
      parseDsRecord('example.com. 3600 IN DS 12345 13 2 zzzznotvalidhex'),
    ).toThrow(/digest/i);
  });

  it('throws when keyTag is out of range', () => {
    expect(() =>
      parseDsRecord('example.com. 3600 IN DS 70000 13 2 deadbeef'),
    ).toThrow(/keyTag/);
  });

  it('throws on insufficient rdata fields', () => {
    expect(() => parseDsRecord('example.com. 3600 IN DS 12345 13')).toThrow(
      /rdata/i,
    );
  });
});
