import { BiMap } from 'mnemonist';

const _dnsRcodes = {
  0: 'NOERROR', //	DNS Query completed successfully
  1: 'FORMERR', //	DNS Query Format Error
  2: 'SERVFAIL', //	Server failed to complete the DNS request
  3: 'NXDOMAIN', //	Domain name does not exist
  4: 'NOTIMP', //	Function not implemented
  5: 'REFUSED', //	The server refused to answer for the query
  6: 'YXDOMAIN', //	Name that should not exist, does exist
  7: 'XRRSET', //	RRset that should not exist, does exist
  8: 'NOTAUTH', //	Server not authoritative for the zone
  9: 'NOTZONE', //	Name not in zone
} as const;
export type DnsNumericRCode = keyof typeof _dnsRcodes;
export type DnsStringRCode = (typeof _dnsRcodes)[DnsNumericRCode];

export const dnsRcodes = BiMap.from(_dnsRcodes) as BiMap<
  DnsNumericRCode,
  DnsStringRCode
>;
