import { parse as tldtsParse } from 'tldts';
import { NAMEFI_DNSSEC_SUPPORTED_TLDS } from './dnssec-tlds';

/**
 * @param domainName
 * @return true if the domain name is supported by DNSSEC
s */
export function supportsDnssec(domainName: string): boolean {
  const parsed = tldtsParse(domainName);
  if (!parsed.publicSuffix) {
    return false;
  }
  return NAMEFI_DNSSEC_SUPPORTED_TLDS.has(parsed.publicSuffix);
}
