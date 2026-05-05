import { dnskeyToRdata } from './dnskeyToRdata';

/**
 * Compute the DNSKEY key tag per RFC 4034 Appendix B.1.
 *
 * The key tag is a 16-bit checksum over the DNSKEY rdata (flags +
 * protocol + algorithm + public key wire bytes). It is **not** stored
 * on the wire — every party recomputes it from the DNSKEY itself, which
 * is why DS records that point at a DNSKEY embed the tag for fast
 * lookup.
 *
 * Algorithm 1 (RSAMD5) uses a different derivation per RFC 4034 B.1
 * that we deliberately do not implement here; it has been deprecated
 * since 2010 and Namefi-supported registrars (R53, Dynadot) reject it.
 */
export function computeKeyTag(
  flags: number,
  protocol: number,
  algorithm: number,
  publicKey: string,
): number {
  const rdata = dnskeyToRdata(flags, protocol, algorithm, publicKey);
  let ac = 0;
  for (let i = 0; i < rdata.length; i++) {
    ac += i & 1 ? rdata[i] : rdata[i] << 8;
  }
  ac += (ac >> 16) & 0xffff;
  return ac & 0xffff;
}
