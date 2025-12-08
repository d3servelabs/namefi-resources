/**
 * Layer-1 XML JSON schema for type mark:treatyOrStatuteType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { MarkHolderTypeXml } from './mark.holderType.layer1.js';
import { MarkContactTypeXml } from './mark.contactType.layer1.js';
import { MarkProtectionTypeXml } from './mark.protectionType.layer1.js';

export const MarkTreatyOrStatuteTypeXml = z.object({
  'mark:id': z.string().regex(/\d+-\d+/),
  'mark:markName': z.string(),
  'mark:holder': z.array(MarkHolderTypeXml).min(1),
  'mark:contact': z.array(MarkContactTypeXml).optional(),
  'mark:protection': z.array(MarkProtectionTypeXml).min(1),
  'mark:label': z
    .array(z.string().regex(/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?/))
    .optional(),
  'mark:goodsAndServices': z.string(),
  'mark:refNum': z.string(),
  'mark:proDate': z.string(),
  'mark:title': z.string(),
  'mark:execDate': z.string(),
});

export type MarkTreatyOrStatuteTypeXml = z.infer<
  typeof MarkTreatyOrStatuteTypeXml
>;
