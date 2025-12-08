/**
 * Layer-1 XML JSON schema for type mark:contactType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { MarkAddrTypeXml } from './mark.addrType.layer1.js';
import { MarkE164TypeXml } from './mark.e164Type.layer1.js';

export const MarkContactTypeXml = z.object({
  '@_type': z.enum(['owner', 'agent', 'thirdparty']).optional(),
  'mark:name': z.string(),
  'mark:org': z.string().optional(),
  'mark:addr': MarkAddrTypeXml,
  'mark:voice': MarkE164TypeXml,
  'mark:fax': MarkE164TypeXml.optional(),
  'mark:email': z.string().min(1),
});

export type MarkContactTypeXml = z.infer<typeof MarkContactTypeXml>;
