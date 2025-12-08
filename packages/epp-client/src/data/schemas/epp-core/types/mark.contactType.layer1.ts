/**
 * Layer-1 XML JSON schema for type mark:contactType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkAddrTypeXml } from './mark.addrType.layer1';
import { MarkE164TypeXml } from './mark.e164Type.layer1';

export const MarkContactTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['owner', 'agent', 'thirdparty']).optional(),
    'mark:name': zloosen(z.object({ '#text': z.string() })),
    'mark:org': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:addr': MarkAddrTypeXml,
    'mark:voice': MarkE164TypeXml,
    'mark:fax': MarkE164TypeXml.optional(),
    'mark:email': zloosen(z.object({ '#text': z.string().min(1) })),
  }),
);

export type MarkContactTypeXml = z.infer<typeof MarkContactTypeXml>;
