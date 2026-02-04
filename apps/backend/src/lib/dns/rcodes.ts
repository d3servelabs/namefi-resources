import { BiMap } from 'mnemonist';

const _dnsRcodes = {
  NOERROR: 0, //	DNS Query completed successfully
  FORMERR: 1, //	DNS Query Format Error
  SERVFAIL: 2, //	Server failed to complete the DNS request
  NXDOMAIN: 3, //	Domain name does not exist
  NOTIMP: 4, //	Function not implemented
  REFUSED: 5, //	The server refused to answer for the query
  YXDOMAIN: 6, //	Name that should not exist, does exist
  XRRSET: 7, //	RRset that should not exist, does exist
  NOTAUTH: 8, //	Server not authoritative for the zone
  NOTZONE: 9, //	Name not in zone
} as const;
export type DnsStringRCode = keyof typeof _dnsRcodes;
export type DnsNumericRCode = (typeof _dnsRcodes)[DnsStringRCode];

export const dnsRcodes = BiMap.from(_dnsRcodes) as BiMap<
  DnsStringRCode,
  DnsNumericRCode
>;
