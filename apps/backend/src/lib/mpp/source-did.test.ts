import { describe, expect, it } from 'vitest';
import { parseMppDidSource } from './source-did';

describe('parseMppDidSource', () => {
  it('parses wallet address and chain from DID source', () => {
    expect(
      parseMppDidSource(
        'did:pkh:eip155:42431:0x0000000000000000000000000000000000000001',
      ),
    ).toEqual({
      chain: 'eip155:42431',
      walletAddress: '0x0000000000000000000000000000000000000001',
    });
  });

  it('returns undefined for invalid DID source', () => {
    expect(parseMppDidSource('did:key:abc123')).toBeUndefined();
  });
});
