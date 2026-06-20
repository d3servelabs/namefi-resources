import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { RecordType } from '@namefi-astra/zod-dns';
import { recordSchema } from '@namefi-astra/zod-dns';
import type { useTranslations } from 'next-intl';
import { z } from 'zod';

/**
 * The subset of the next-intl `dnsManagement` translator used by these
 * factories: a function from a known translation key to its localized string.
 */
type TranslateFn = ReturnType<typeof useTranslations<'dnsManagement'>>;

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

// TTL options in seconds, paired with the translation key for their label.
// The label is resolved at the (translation-bound) call site via `t(labelKey)`.
const TTL_OPTION_VALUES = [
  { value: 60, labelKey: 'dialogs.form.ttlOption1Minute' },
  { value: 300, labelKey: 'dialogs.form.ttlOption5Minutes' },
  { value: 1200, labelKey: 'dialogs.form.ttlOption20Minutes' },
  { value: 3600, labelKey: 'dialogs.form.ttlOption1Hour' },
  { value: 86400, labelKey: 'dialogs.form.ttlOption1Day' },
  { value: 604800, labelKey: 'dialogs.form.ttlOption1Week' },
] as const;

export type TtlOption = {
  value: number;
  labelKey: Parameters<TranslateFn>[0];
};

// TTL options with the translation key for each label. Resolve the label with
// `t(option.labelKey)` where a `useTranslations('dnsManagement')` binding exists.
export function getTtlOptions(): readonly TtlOption[] {
  return TTL_OPTION_VALUES;
}

// Schema for DNS record form (factory so error messages can be translated)
export function getDnsRecordSchema(t: TranslateFn) {
  return z
    .object({
      type: z
        .string()
        .min(1, { error: t('dialogs.form.errorRecordTypeRequired') }),
      name: z
        .string()
        .optional()
        .transform((val) => val || '@'),
      domain: z.string(),
      rdata: z
        .string()
        .min(1, { message: t('dialogs.form.errorValueRequired') }),
      ttl: z.number().min(1, { message: t('dialogs.form.errorTtlRequired') }),
    })
    .superRefine((value, ctx) => {
      const recordValidation = recordSchema.safeParse({
        type: value.type,
        name: value.name,
        rdata: value.rdata,
        ttl: value.ttl,
      });

      if (!recordValidation.success) {
        for (const issue of recordValidation.error.issues) {
          ctx.addIssue({
            code: 'custom',
            path: issue.path,
            message: issue.message,
          });
        }
      }
    });
}

export type DnsRecordFormValues = z.input<
  ReturnType<typeof getDnsRecordSchema>
>;

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
