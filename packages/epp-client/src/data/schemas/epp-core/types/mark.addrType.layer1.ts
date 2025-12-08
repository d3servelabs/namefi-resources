/**
 * Layer-1 XML JSON schema for type mark:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const MarkAddrTypeXml = zloosen(
  z.object({
    'mark:street': z
      .array(z.union([z.string(), zloosen(z.object({ '#text': z.string() }))]))
      .min(1),
    'mark:city': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:sp': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'mark:pc': z
      .union([
        z.string().max(16),
        zloosen(z.object({ '#text': z.string().max(16) })),
      ])
      .optional(),
    'mark:cc': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type MarkAddrTypeXml = z.infer<typeof MarkAddrTypeXml>;
