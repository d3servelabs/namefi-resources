/**
 * Layer-1 XML JSON schema for type mark:holderType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkAddrTypeXml } from './mark.addrType.layer1';
import { MarkE164TypeXml } from './mark.e164Type.layer1';

export const MarkHolderTypeXml = zloosen(
  z.object({
    '@_entitlement': z.enum(['owner', 'assignee', 'licensee']).optional(),
    'mark:name': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:org': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:addr': MarkAddrTypeXml,
    'mark:voice': MarkE164TypeXml.optional(),
    'mark:fax': MarkE164TypeXml.optional(),
    'mark:email': zloosen(z.object({ '#text': z.string().min(1) })).optional(),
  }),
);

export type MarkHolderTypeXml = z.infer<typeof MarkHolderTypeXml>;
