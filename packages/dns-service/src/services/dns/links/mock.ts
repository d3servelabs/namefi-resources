import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { DnsStringRecordTypeCode } from '#lib/dns/record-type-codes';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import type { DnsResponse, DnsTable } from '#lib/dns/types';
import { logger } from '#lib/logger';

export function getAnswerForDnsQueryMock(
  recordName: NamefiNormalizedDomain,
  recordType: DnsStringRecordTypeCode,
): Promise<DnsResponse | null> {
  const qType = dnsRecordTypeCodes.get(recordType);
  if (!qType) {
    return Promise.resolve(null);
  }

  const record = mockDnsTable[`${recordName}.`]?.[qType];
  if (!record) {
    return Promise.resolve(null);
  }

  logger.trace(
    { recordName, qType, foundRecord: record },
    'Found mock DNS record',
  );

  return Promise.resolve({
    RCODE: 0,
    Answer: [
      {
        name: `${recordName}.`,
        type: qType,
        TTL: 300,
        data: record,
      },
    ],
    Question: [
      {
        name: `${recordName}.`,
        type: qType,
      },
    ],
  });
}

const mockDnsTable: DnsTable = {
  'example.com.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 mail.example.com',
  },
  '0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x801.click',
  },
  '1.0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 1.0x801.click',
    [dnsRecordTypeCodes.get('TXT') as number]: 'abcd',
  },
  '0x002.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x002.click',
  },
};
