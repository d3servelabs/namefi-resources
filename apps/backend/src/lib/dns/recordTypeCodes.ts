import { BiMap } from 'mnemonist';

export const dnsRecordTypeCodes = BiMap.from({
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  NS: 2,
  SOA: 6,
  TXT: 16,
}) as BiMap<string, number>;
