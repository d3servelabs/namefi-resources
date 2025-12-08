/**
 * Layer-1 XML JSON schema for type mark:holderType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { MarkAddrTypeXml } from './mark.addrType.layer1.js';
import { MarkE164TypeXml } from './mark.e164Type.layer1.js';

export const MarkHolderTypeXml = z.object({
  '@_entitlement': z.enum(['owner', 'assignee', 'licensee']).optional(),
  'mark:name': z.string().optional(),
  'mark:org': z.string().optional(),
  'mark:addr': MarkAddrTypeXml,
  'mark:voice': MarkE164TypeXml.optional(),
  'mark:fax': MarkE164TypeXml.optional(),
  'mark:email': z.string().min(1).optional(),
});

export type MarkHolderTypeXml = z.infer<typeof MarkHolderTypeXml>;
