export type DnssecPublicKey = string;

export type DnssecKey = {
  /**
   * The number of the public key’s cryptographic algorithm according to an IANA assignment.  If Route53 is your DNS service, set this to 13. For more information about enabling DNSSEC signing, see Enabling DNSSEC signing and establishing a chain of trust.
   */
  algorithm?: DnssecAlgorithms;
  /**
   * Defines the type of key. It can be either a KSK (key-signing-key, value 257) or ZSK (zone-signing-key, value 256). Using KSK is always encouraged. Only use ZSK if your DNS provider isn't Route 53 and you don’t have KSK available. If you have KSK and ZSK keys, always use KSK to create a delegations signer (DS) record. If you have ZSK keys only – use ZSK to create a DS record.
   */
  flags?: DnssecFlags;
  /**
   * The base64-encoded public key part of the key pair that is passed to the registry .
   */
  publicKey?: DnssecPublicKey;
  /**
   * optional id, use publicKey if this is unavailable
   */
  id?: string;
  /**
   *  The number of the DS digest algorithm according to an IANA assignment. For more information, see IANA for DNSSEC Delegation Signer (DS) Resource Record (RR) Type Digest Algorithms.
   */
  digestType?: DnssecDigestType;
  /**
   *  The delegation signer digest. Digest is calculated from the public key provided using specified digest algorithm and this digest is the actual value returned from the registry nameservers as the value of DS records.
   */
  digest?: string;
  /**
   *  A numeric identification of the DNSKEY record referred to by this DS record.
   */
  keyTag?: number;
  keyData?: {
    flags: number;
    algorithm: number;
    protocol: number;
    publicKey: string;
  };
};

export const DnssecAlgorithms = Object.freeze({
  /**
   * @deprecated [Not Deprecated] Not Supported on AWS
   */
  RSA_MD5: 1,
  DIFFIE_HELLMAN: 2,
  DSA_SHA_1: 3,
  /**
   * @deprecated [Not Deprecated] Not Supported on AWS
   */
  ECDSA: 4,
  RSA_SHA_1: 5,
  DSA_NSEC3_SHA1: 6,
  RSA_SHA1_NSEC3_SHA1: 7,
  RSA_SHA_256: 8,
  RSA_SHA_512: 10,
  GOSTR_34_10_2001: 12,
  ECDSA_P256SHA256: 13,
  ECDSA_P384SHA384: 14,
  ED25519: 15,
  ED448: 16,
  /**
   * @deprecated [Not Deprecated] Not Supported on AWS
   */
  INDIRECT: 252,
  PRIVATE_DNS: 253,
  PRIVATE_OID: 254,
});
export type DnssecAlgorithms =
  (typeof DnssecAlgorithms)[keyof typeof DnssecAlgorithms];

export const DnssecDigestType = Object.freeze({
  SHA_1: 1,
  SHA_256: 2,
  GOSTR_34_11_94: 3,
  SHA_384: 4,
});
export type DnssecDigestType =
  (typeof DnssecDigestType)[keyof typeof DnssecDigestType];

export const DnssecFlags = Object.freeze({
  ZSK: 256,
  KSK: 257,
});
export type DnssecFlags = (typeof DnssecFlags)[keyof typeof DnssecFlags];
