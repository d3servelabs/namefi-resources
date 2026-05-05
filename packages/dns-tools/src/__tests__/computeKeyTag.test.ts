import { describe, expect, it } from 'vitest';
import { computeKeyTag } from '../computeKeyTag';
import { DNSKEY_FLAGS } from '../consts';

describe('computeKeyTag', () => {
  it('matches the RFC 4034 Appendix C example (key id = 60485)', () => {
    // ZSK from RFC 4034 Appendix C — key id is documented as 60485.
    const flags = DNSKEY_FLAGS.ZSK;
    const protocol = 3;
    const algorithm = 5;
    const publicKey =
      'AQOeiiR0GOMYkDshWoSKz9XzfwJr1AYtsmx3TGkJaNXVbfi/2pHm822aJ5iI9BMzNXxeYCmZDRD99WYwYqUSdjMmmAphXdvxegXd/M5+X7OrzKBaMbCVdFLUUh6DhweJBjEVv5f2wwjM9XzcnOf+EPbtG9DMBmADjFDc2w/rljwvFw==';

    expect(computeKeyTag(flags, protocol, algorithm, publicKey)).toBe(60485);
  });

  it('returns a deterministic value within the 16-bit range', () => {
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const tag = computeKeyTag(DNSKEY_FLAGS.KSK, 3, 13, publicKey);
    expect(tag).toBe(computeKeyTag(DNSKEY_FLAGS.KSK, 3, 13, publicKey));
    expect(tag).toBeGreaterThanOrEqual(0);
    expect(tag).toBeLessThanOrEqual(0xffff);
  });

  it('produces different tags for KSK vs ZSK with the same key material', () => {
    const publicKey =
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const ksk = computeKeyTag(DNSKEY_FLAGS.KSK, 3, 13, publicKey);
    const zsk = computeKeyTag(DNSKEY_FLAGS.ZSK, 3, 13, publicKey);
    expect(ksk).not.toBe(zsk);
  });
});
