/**
 * Layer-1 XML JSON schema for type mark:courtType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkHolderTypeXml } from './mark.holderType.layer1';
import { MarkContactTypeXml } from './mark.contactType.layer1';

export const MarkCourtTypeXml = zloosen(
  z.object({
    'mark:id': zloosen(z.object({ '#text': z.string().regex(/\d+-\d+/) })),
    'mark:markName': zloosen(z.object({ '#text': z.string() })),
    'mark:holder': z.array(MarkHolderTypeXml).min(1),
    'mark:contact': z.array(MarkContactTypeXml).optional(),
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
    'mark:refNum': zloosen(z.object({ '#text': z.string() })),
    'mark:proDate': zloosen(z.object({ '#text': z.string() })),
    'mark:cc': zloosen(z.object({ '#text': z.string() })),
    'mark:region': z
      .array(zloosen(z.object({ '#text': z.string() })))
      .optional(),
    'mark:courtName': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type MarkCourtTypeXml = z.infer<typeof MarkCourtTypeXml>;
