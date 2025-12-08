/**
 * Layer-1 XML JSON schema for type mark:trademarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { MarkHolderTypeXml } from './mark.holderType.layer1.js';
import { MarkContactTypeXml } from './mark.contactType.layer1.js';

export const MarkTrademarkTypeXml = z.object({
  'mark:id': z.string().regex(/\d+-\d+/),
  'mark:markName': z.string(),
  'mark:holder': z.array(MarkHolderTypeXml).min(1),
  'mark:contact': z.array(MarkContactTypeXml).optional(),
  'mark:jurisdiction': z.string(),
  'mark:class': z.array(z.string().regex(/^-?\d+$/)).optional(),
  'mark:label': z
    .array(z.string().regex(/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?/))
    .optional(),
  'mark:goodsAndServices': z.string(),
  'mark:apId': z.string().optional(),
  'mark:apDate': z.string().optional(),
  'mark:regNum': z.string(),
  'mark:regDate': z.string(),
  'mark:exDate': z.string().optional(),
});

export type MarkTrademarkTypeXml = z.infer<typeof MarkTrademarkTypeXml>;
