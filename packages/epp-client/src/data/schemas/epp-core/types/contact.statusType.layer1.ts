/**
 * Layer-1 XML JSON schema for type contact:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactStatusTypeXml = z.object({
  '@_s': z.enum([
    'clientDeleteProhibited',
    'clientTransferProhibited',
    'clientUpdateProhibited',
    'linked',
    'ok',
    'pendingCreate',
    'pendingDelete',
    'pendingTransfer',
    'pendingUpdate',
    'serverDeleteProhibited',
    'serverTransferProhibited',
    'serverUpdateProhibited',
  ]),
  '@_lang': z.string().default('en').optional(),
  '#text': z.string(),
});

export type ContactStatusTypeXml = z.infer<typeof ContactStatusTypeXml>;
