import { describe, expect, it } from 'vitest';
import { resolveListingSellerUsername } from './listings.service';

describe('resolveListingSellerUsername', () => {
  it('uses explicit seller usernames when present', () => {
    expect(
      resolveListingSellerUsername({
        sellerUsername: 'alice',
        externalSource: 'namefi_marketplace',
        externalAuthorId: '0xabcdef1234567890abcdef1234567890abcdef12',
      }),
    ).toBe('@alice');
  });

  it('uses marketplace author ids as routeable seller identities', () => {
    expect(
      resolveListingSellerUsername({
        sellerUsername: null,
        externalSource: 'namefi_marketplace',
        externalAuthorId: '0xabcdef1234567890abcdef1234567890abcdef12',
      }),
    ).toBe('@0xabcdef1234567890abcdef1234567890abcdef12');
  });

  it('does not invent non-marketplace seller usernames from author ids', () => {
    expect(
      resolveListingSellerUsername({
        sellerUsername: null,
        externalSource: 'namepros',
        externalAuthorId: 'namepros-author-123',
      }),
    ).toBeNull();
  });
});
