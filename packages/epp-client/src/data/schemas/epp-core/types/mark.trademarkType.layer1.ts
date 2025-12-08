/**
 * Layer-1 XML JSON schema for type mark:trademarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { MarkHolderTypeXml } from './mark.holderType.layer1.js';
import { MarkContactTypeXml } from './mark.contactType.layer1.js';

export const MarkTrademarkTypeXml = zloosen(
  z.object({
    'mark:id': z.union([
      z.string().regex(/\d+-\d+/),
      zloosen(z.object({ '#text': z.string().regex(/\d+-\d+/) })),
    ]),
    'mark:markName': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:holder': z.array(MarkHolderTypeXml).min(1),
    'mark:contact': z.array(MarkContactTypeXml).optional(),
    'mark:jurisdiction': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:class': z
      .array(
        z.union([
          z.string().regex(/^-?\d+$/),
          zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
        ]),
      )
      .optional(),
    'mark:label': z
      .array(
        z.union([
          z.string().regex(/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?/),
          zloosen(
            z.object({
              '#text': z
                .string()
                .regex(/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?/),
            }),
          ),
        ]),
      )
      .optional(),
    'mark:goodsAndServices': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:apId': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'mark:apDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'mark:regNum': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:regDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:exDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type MarkTrademarkTypeXml = z.infer<typeof MarkTrademarkTypeXml>;
