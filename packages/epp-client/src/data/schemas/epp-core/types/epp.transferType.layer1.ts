/**
 * Layer-1 XML JSON schema for type epp:transferType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainTransferXml } from '../elements/domain.transfer.layer1.js';
import { ContactTransferXml } from '../elements/contact.transfer.layer1.js';

export const EppTransferTypeXml = z
  .object({
    '@_op': z.enum(['approve', 'cancel', 'query', 'reject', 'request']),
  })
  .and(
    z.union([
      z.object({
        'domain:transfer': DomainTransferXml,
      }),
      z.object({
        'contact:transfer': ContactTransferXml,
      }),
    ]),
  );

export type EppTransferTypeXml = z.infer<typeof EppTransferTypeXml>;
