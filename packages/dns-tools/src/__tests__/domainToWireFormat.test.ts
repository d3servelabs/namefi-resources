import { describe, expect, it } from 'vitest';
import { domainToWireFormat } from '../domainToWireFormat';

describe('domainToWireFormat', () => {
  it('should correctly convert a simple domain to wire format', () => {
    const domain = 'example.com';
    const wireFormat = domainToWireFormat(domain);

    // Example.com should be:
    // [7]example[3]com[0]
    const expected = Buffer.concat([
      Buffer.from([7]),
      Buffer.from('example', 'ascii'),
      Buffer.from([3]),
      Buffer.from('com', 'ascii'),
      Buffer.from([0]),
    ]);

    expect(wireFormat.equals(expected)).toBe(true);
  });

  it('should handle domains with multiple subdomains', () => {
    const domain = 'sub.example.com';
    const wireFormat = domainToWireFormat(domain);

    const expected = Buffer.concat([
      Buffer.from([3]),
      Buffer.from('sub', 'ascii'),
      Buffer.from([7]),
      Buffer.from('example', 'ascii'),
      Buffer.from([3]),
      Buffer.from('com', 'ascii'),
      Buffer.from([0]),
    ]);

    expect(wireFormat.equals(expected)).toBe(true);
  });

  it('should handle domains with trailing dot', () => {
    const domain = 'example.com.';
    const wireFormat = domainToWireFormat(domain);

    const expected = Buffer.concat([
      Buffer.from([7]),
      Buffer.from('example', 'ascii'),
      Buffer.from([3]),
      Buffer.from('com', 'ascii'),
      Buffer.from([0]),
    ]);

    expect(wireFormat.equals(expected)).toBe(true);
  });

  it('should convert domain to lowercase', () => {
    const domain = 'ExAmPlE.CoM';
    const wireFormat = domainToWireFormat(domain);

    const expected = Buffer.concat([
      Buffer.from([7]),
      Buffer.from('example', 'ascii'),
      Buffer.from([3]),
      Buffer.from('com', 'ascii'),
      Buffer.from([0]),
    ]);

    expect(wireFormat.equals(expected)).toBe(true);
  });
});
