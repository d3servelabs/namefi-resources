/**
 * Layer-1 XML JSON schema for type mark:treatyOrStatuteType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkHolderTypeXml } from './mark.holderType.layer1';
import { MarkContactTypeXml } from './mark.contactType.layer1';
import { MarkProtectionTypeXml } from './mark.protectionType.layer1';

export const MarkTreatyOrStatuteTypeXml = zloosen(
  z.object({
    'mark:id': zloosen(z.object({ '#text': z.string().regex(/\d+-\d+/) })),
    'mark:markName': zloosen(z.object({ '#text': z.string() })),
    'mark:holder': z.array(MarkHolderTypeXml).min(1),
    'mark:contact': z.array(MarkContactTypeXml).optional(),
    'mark:protection': z.array(MarkProtectionTypeXml).min(1),
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
    'mark:title': zloosen(z.object({ '#text': z.string() })),
    'mark:execDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type MarkTreatyOrStatuteTypeXml = z.infer<
  typeof MarkTreatyOrStatuteTypeXml
>;
