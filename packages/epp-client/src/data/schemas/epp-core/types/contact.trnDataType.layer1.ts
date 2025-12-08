/**
 * Layer-1 XML JSON schema for type contact:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ContactTrnDataTypeXml = zloosen(
  z.object({
    'contact:id': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:trStatus': z.union([
      z.enum([
        'clientApproved',
        'clientCancelled',
        'clientRejected',
        'pending',
        'serverApproved',
        'serverCancelled',
      ]),
      zloosen(
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
    ]),
    'contact:reID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:reDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'contact:acID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:acDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type ContactTrnDataTypeXml = z.infer<typeof ContactTrnDataTypeXml>;
