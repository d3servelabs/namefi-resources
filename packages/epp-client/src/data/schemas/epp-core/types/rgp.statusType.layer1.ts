/**
 * Layer-1 XML JSON schema for type rgp:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const RgpStatusTypeXml = z.object({
  '@_s': z.enum([
    'addPeriod',
    'autoRenewPeriod',
    'renewPeriod',
    'transferPeriod',
    'pendingDelete',
    'pendingRestore',
    'redemptionPeriod',
  ]),
  '@_lang': z.string().default('en').optional(),
  '#text': z.string(),
});

export type RgpStatusTypeXml = z.infer<typeof RgpStatusTypeXml>;
