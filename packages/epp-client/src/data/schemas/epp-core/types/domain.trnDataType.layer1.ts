/**
 * Layer-1 XML JSON schema for type domain:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const DomainTrnDataTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'domain:trStatus': zloosen(
      z.object({
        '#text': z.enum([
          'clientApproved',
          'clientCancelled',
          'clientRejected',
          'pending',
          'serverApproved',
          'serverCancelled',
        ]),
      }),
    ),
    'domain:reID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'domain:reDate': zloosen(z.object({ '#text': z.string() })),
    'domain:acID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'domain:acDate': zloosen(z.object({ '#text': z.string() })),
    'domain:exDate': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type DomainTrnDataTypeXml = z.infer<typeof DomainTrnDataTypeXml>;
