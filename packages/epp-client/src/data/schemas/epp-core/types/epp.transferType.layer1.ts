/**
 * Layer-1 XML JSON schema for type epp:transferType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainTransferXml } from '../elements/domain.transfer.layer1.js';
import { ContactTransferXml } from '../elements/contact.transfer.layer1.js';

const _baseFields = z.object({
  '@_op': z.enum(['approve', 'cancel', 'query', 'reject', 'request']),
});

export const EppTransferTypeXml = z.union([
  zloosen(
    z.object({
      ..._baseFields.shape,
      'domain:transfer': DomainTransferXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'contact:transfer': ContactTransferXml,
    }),
  ),
]);

export type EppTransferTypeXml = z.infer<typeof EppTransferTypeXml>;
