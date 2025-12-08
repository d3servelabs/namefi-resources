/**
 * Layer-1 XML JSON schema for type contact:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ContactTrnDataTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:trStatus': zloosen(
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
    'contact:reID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:reDate': zloosen(z.object({ '#text': z.string() })),
    'contact:acID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:acDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type ContactTrnDataTypeXml = z.infer<typeof ContactTrnDataTypeXml>;
