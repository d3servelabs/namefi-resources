import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import { recordSchema } from '@namefi-astra/zod-dns';
import { z } from 'zod';

// DNS record types
export const DNS_RECORD_TYPES = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SRV',
] as const;

// TTL options in seconds with human-readable labels
export const TTL_OPTIONS = [
  { value: 60, label: '1 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 1200, label: '20 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '1 day' },
  { value: 604800, label: '1 week' },
];

// Schema for DNS record form
export const dnsRecordSchema = z
  .object({
    type: z.string({
      required_error: 'Record type is required',
      invalid_type_error: 'Invalid record type',
    }),
    name: z
      .string()
      .optional()
      .transform((val) => val || '@'),
    domain: z.string(),
    rdata: z.string().min(1, { message: 'Value is required' }),
    ttl: z.number().min(1, { message: 'TTL is required' }),
  })
  .pipe(recordSchema);

export type DnsRecordFormValues = (typeof dnsRecordSchema)['_input'];

// Helper function to convert form values to DnsRecord
export function formValuesToDnsRecord(
  formValues: DnsRecordFormValues,
  existingRecord?: { id?: string; notes?: string },
): {
  id?: string;
  type: RecordType;
  name: string;
  rdata: string;
  ttl: number;
  notes?: string;
} {
  return {
    id:
      existingRecord?.id ||
      `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: formValues.type as RecordType,
    name: `${formValues.name || '@'}`,
    rdata: formValues.rdata,
    ttl: formValues.ttl,
    notes: existingRecord?.notes || 'by User',
  };
}

// Helper function to convert DnsRecord to form values
export function dnsRecordToFormValues(record: {
  type?: string;
  name?: string;
  rdata?: string;
  zoneName: NamefiNormalizedDomain;
  ttl?: number;
}): DnsRecordFormValues {
  return {
    type: record.type || '',
    name: record.name,
    domain: record.zoneName,
    rdata: record.rdata || '',
    ttl: record.ttl || 0,
  };
}
