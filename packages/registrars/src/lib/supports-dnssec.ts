import { parse as tldtsParse } from 'tldts';
import { DNSSEC_SUPPORTED_TLDS } from './abstract-registrar/data/dnssec-tlds';

/**
 * @param domainName
 * @return true if the domain name is supported by DNSSEC
s */
export function supportsDnssec(domainName: string): boolean {
  const parsed = tldtsParse(domainName);
  if (!parsed.publicSuffix) {
    return false;
  }
  return DNSSEC_SUPPORTED_TLDS.has(parsed.publicSuffix);
}
