/**
 * Layer-1 XML JSON schema for type mark:trademarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkHolderTypeXml } from './mark.holderType.layer1';
import { MarkContactTypeXml } from './mark.contactType.layer1';

export const MarkTrademarkTypeXml = zloosen(
  z.object({
    'mark:id': zloosen(z.object({ '#text': z.string().regex(/\d+-\d+/) })),
    'mark:markName': zloosen(z.object({ '#text': z.string() })),
    'mark:holder': z.array(MarkHolderTypeXml).min(1),
    'mark:contact': z.array(MarkContactTypeXml).optional(),
    'mark:jurisdiction': zloosen(z.object({ '#text': z.string() })),
    'mark:class': z
      .array(zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })))
      .optional(),
    'mark:label': z
      .array(
        zloosen(
          z.object({
            '#text': z.string().regex(/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?/),
          }),
        ),
      )
      .optional(),
    'mark:goodsAndServices': zloosen(z.object({ '#text': z.string() })),
    'mark:apId': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:apDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:regNum': zloosen(z.object({ '#text': z.string() })),
    'mark:regDate': zloosen(z.object({ '#text': z.string() })),
    'mark:exDate': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type MarkTrademarkTypeXml = z.infer<typeof MarkTrademarkTypeXml>;
