/**
 * Layer-1 XML JSON schema for type mark:courtType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { MarkHolderTypeXml } from './mark.holderType.layer1.js';
import { MarkContactTypeXml } from './mark.contactType.layer1.js';

export const MarkCourtTypeXml = zloosen(
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
    'mark:refNum': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:proDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:cc': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:region': z
      .array(z.union([z.string(), zloosen(z.object({ '#text': z.string() }))]))
      .optional(),
    'mark:courtName': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type MarkCourtTypeXml = z.infer<typeof MarkCourtTypeXml>;
