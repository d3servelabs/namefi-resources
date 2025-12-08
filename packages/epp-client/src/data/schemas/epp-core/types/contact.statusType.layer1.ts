/**
 * Layer-1 XML JSON schema for type contact:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ContactStatusTypeXml = zloosen(
  z.object({
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
  }),
);

export type ContactStatusTypeXml = z.infer<typeof ContactStatusTypeXml>;
