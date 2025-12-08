/**
 * Layer-1 XML JSON schema for type domain:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainStatusTypeXml = zloosen(
  z.object({
    '@_s': z.enum([
      'clientDeleteProhibited',
      'clientHold',
      'clientRenewProhibited',
      'clientTransferProhibited',
      'clientUpdateProhibited',
      'inactive',
      'ok',
      'pendingCreate',
      'pendingDelete',
      'pendingRenew',
      'pendingTransfer',
      'pendingUpdate',
      'serverDeleteProhibited',
      'serverHold',
      'serverRenewProhibited',
      'serverTransferProhibited',
      'serverUpdateProhibited',
    ]),
    '@_lang': z.string().default('en').optional(),
    '#text': z.string(),
  }),
);

export type DomainStatusTypeXml = z.infer<typeof DomainStatusTypeXml>;
