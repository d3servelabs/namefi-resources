export const DNSKEY_FLAGS = {
  ZSK: 256,
  KSK: 257,
};
export type DNSKEY_FLAGS = (typeof DNSKEY_FLAGS)[keyof typeof DNSKEY_FLAGS];

export const DIGEST_TYPE = {
  sha1: 1,
  sha256: 2,
  gost_r3411_94: 3,
  sha384: 4,
};
export type DIGEST_TYPE = (typeof DIGEST_TYPE)[keyof typeof DIGEST_TYPE];

export const DIGEST_TYPE_DISPLAY_NAME = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  gost_r3411_94: 'GOST R 34.11-94',
  sha384: 'SHA-384',
};
export type DIGEST_TYPE_DISPLAY_NAME =
  (typeof DIGEST_TYPE_DISPLAY_NAME)[keyof typeof DIGEST_TYPE_DISPLAY_NAME];

export function getDigestTypeDisplayName(
  digestType: DIGEST_TYPE,
): DIGEST_TYPE_DISPLAY_NAME | null {
  switch (digestType) {
    case DIGEST_TYPE.sha1:
      return DIGEST_TYPE_DISPLAY_NAME.sha1;
    case DIGEST_TYPE.sha256:
      return DIGEST_TYPE_DISPLAY_NAME.sha256;
    case DIGEST_TYPE.gost_r3411_94:
      return DIGEST_TYPE_DISPLAY_NAME.gost_r3411_94;
    case DIGEST_TYPE.sha384:
      return DIGEST_TYPE_DISPLAY_NAME.sha384;
    default:
      return null;
  }
}
export function getDigestTypeName(
  digestTypeName: DIGEST_TYPE,
): 'sha1' | 'sha256' | 'gost_r3411_94' | 'sha384' | null {
  switch (digestTypeName) {
    case DIGEST_TYPE.sha1:
      return 'sha1';
    case DIGEST_TYPE.sha256:
      return 'sha256';
    case DIGEST_TYPE.gost_r3411_94:
      return 'gost_r3411_94';
    case DIGEST_TYPE.sha384:
      return 'sha384';
    default:
      return null;
  }
}
