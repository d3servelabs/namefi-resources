/**
 * Layer-1 XML JSON schema for type epp:transferType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainTransferXml } from '../elements/domain.transfer.layer1';
import { ContactTransferXml } from '../elements/contact.transfer.layer1';

const _base0 = z.object({
  '@_op': z.enum(['approve', 'cancel', 'query', 'reject', 'request']),
});

export const EppTransferTypeXml = z.union([
  zloosen(
    z.object({
      ..._base0.shape,
      'domain:transfer': DomainTransferXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'contact:transfer': ContactTransferXml,
    }),
  ),
]);

export type EppTransferTypeXml = z.infer<typeof EppTransferTypeXml>;
