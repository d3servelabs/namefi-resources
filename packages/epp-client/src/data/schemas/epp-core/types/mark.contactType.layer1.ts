/**
 * Layer-1 XML JSON schema for type mark:contactType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { MarkAddrTypeXml } from './mark.addrType.layer1.js';
import { MarkE164TypeXml } from './mark.e164Type.layer1.js';

export const MarkContactTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['owner', 'agent', 'thirdparty']).optional(),
    'mark:name': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:org': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'mark:addr': MarkAddrTypeXml,
    'mark:voice': MarkE164TypeXml,
    'mark:fax': MarkE164TypeXml.optional(),
    'mark:email': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
  }),
);

export type MarkContactTypeXml = z.infer<typeof MarkContactTypeXml>;
