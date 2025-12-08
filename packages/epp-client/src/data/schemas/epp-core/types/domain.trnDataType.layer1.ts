/**
 * Layer-1 XML JSON schema for type domain:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainTrnDataTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:trStatus': z.union([
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
    'domain:reID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'domain:reDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'domain:acID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'domain:acDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'domain:exDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type DomainTrnDataTypeXml = z.infer<typeof DomainTrnDataTypeXml>;
