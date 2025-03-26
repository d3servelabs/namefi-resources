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
  { value: '300', label: '5 minutes' },
  { value: '1200', label: '20 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '1 day' },
  { value: '604800', label: '1 week' },
];

// Schema for DNS record form
export const dnsRecordSchema = z.object({
  type: z.string({
    required_error: 'Record type is required',
    invalid_type_error: 'Invalid record type',
  }),
  name: z.string().optional(),
  domain: z.string(),
  rdata: z.string().min(1, { message: 'Value is required' }),
  ttl: z.number().min(1, { message: 'TTL is required' }),
});

export type DnsRecordFormValues = z.infer<typeof dnsRecordSchema>;

// Helper function to convert form values to DnsRecord
export function formValuesToDnsRecord(
  formValues: DnsRecordFormValues,
  existingRecord?: { id?: string; notes?: string },
): {
  id?: string;
  type: string;
  name: string;
  rdata: string;
  ttl: number;
  notes?: string;
} {
  return {
    id:
      existingRecord?.id ||
      `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: formValues.type,
    name: `${formValues.name || ''}${formValues.domain}`,
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
  ttl?: number;
}): DnsRecordFormValues {
  const nameParts = (record.name || '').split('.');
  const name = nameParts[0] || '';
  const domain =
    nameParts.length > 1 ? `.${nameParts.slice(1).join('.')}` : '.example.com';

  return {
    type: record.type || '',
    name,
    domain,
    rdata: record.rdata || '',
    ttl: record.ttl || 0,
  };
}
