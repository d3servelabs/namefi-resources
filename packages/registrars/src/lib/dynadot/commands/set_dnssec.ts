import type { DynadotResponseCode } from '../common-types';

export type DynadotSetDnssecCommandParams = {
  /**
   * The domain name for which you need to set up dnssec
   */
  domain_name: string;

  /**
	 *  You can choose a number from the following list to represent your digital signature algorithm: RSA/MD5(1)
 Diffie-Hellman (2) DSA/SHA-1(3) Elliptic Curve (4) RSA/SHA-1(5) DSA-NSEC3-SHA1(6) RSASHA1-NSEC3-SHA1(7) RSA/SHA-256(8) RSA/SHA-512(10) GOSTR 34.10-2001(12) ECDSA Curve P-256 with SHA-256(13 ECDSA Curve P-384 with SHA-384(14) ED25519(15 ED448(16) Indirect (252) Private DNS (253 Private OID (254)
	 * */
  algorithm: DynadotDnssecAlgorithms; // TODO Mistake in docs it's lowercase not pascal
} & (
  | {
      /**
       *  You can choose a number from the following list to represent your digital signature symbol: ZSK(256) KSK(257)
       * */
      flags: DynadotDnssecFlags;

      /**
       *  The Public Key must be in base64 encoding.
       * */
      public_key: string;
    }
  | {
      /**
       *  Key tag
       * */
      key_tag: number | string;

      /**
       *  You can choose a number from the following list to represent your digital signature type: SHA-1(1) SHA-256(2) GOSTR 34.11-94 (3) SHA-384(4)
       * */
      digest_type: DynadotDnssecDigestType;

      /**
       *  Digest
       * */
      digest: string;
    }
);
export type DynadotSetDnssecCommandOutput = {
  SetDnssecResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};

export enum DynadotDnssecAlgorithms {
  'RSA/MD5' = 1,
  'Diffie-Hellman' = 2,
  'DSA/SHA-1' = 3,
  'Elliptic Curve' = 4,
  'RSA/SHA-1' = 5,
  'DSA-NSEC3-SHA1' = 6,
  'RSASHA1-NSEC3-SHA1' = 7,
  'RSA/SHA-256' = 8,
  'RSA/SHA-512' = 10,
  'GOSTR 34.10-2001' = 12,
  'ECDSA Curve P-256 with SHA-256' = 13,
  'ECDSA Curve P-384 with SHA-384' = 14,
  ED25519 = 15,
  ED448 = 16,
  Indirect = 252,
  'Private DNS' = 253,
  'Private OID' = 254,
}

export enum DynadotDnssecDigestType {
  'SHA-1' = 1,
  'SHA-256' = 2,
  'GOSTR 34.11-94' = 3,
  'SHA-384' = 4,
}

export enum DynadotDnssecFlags {
  ZSK = 256,
  KSK = 257,
}
