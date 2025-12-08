/**
 * Layer-1 XML JSON schema for type mark:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const MarkAddrTypeXml = zloosen(
  z.object({
    'mark:street': z.array(zloosen(z.object({ '#text': z.string() }))).min(1),
    'mark:city': zloosen(z.object({ '#text': z.string() })),
    'mark:sp': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:pc': zloosen(z.object({ '#text': z.string().max(16) })).optional(),
    'mark:cc': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type MarkAddrTypeXml = z.infer<typeof MarkAddrTypeXml>;
