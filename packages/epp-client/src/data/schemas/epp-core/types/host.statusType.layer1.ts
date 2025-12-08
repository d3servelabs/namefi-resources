/**
 * Layer-1 XML JSON schema for type host:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const HostStatusTypeXml = zloosen(
  z.object({
    '@_s': z.enum([
      'clientDeleteProhibited',
      'clientUpdateProhibited',
      'linked',
      'ok',
      'pendingCreate',
      'pendingDelete',
      'pendingTransfer',
      'pendingUpdate',
      'serverDeleteProhibited',
      'serverUpdateProhibited',
    ]),
    '@_lang': z.string().default('en').optional(),
    '#text': z.string(),
  }),
);

export type HostStatusTypeXml = z.infer<typeof HostStatusTypeXml>;
