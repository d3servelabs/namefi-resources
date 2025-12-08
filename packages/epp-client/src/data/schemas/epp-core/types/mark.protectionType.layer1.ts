/**
 * Layer-1 XML JSON schema for type mark:protectionType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const MarkProtectionTypeXml = zloosen(
  z.object({
    'mark:cc': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'mark:region': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'mark:ruling': z
      .array(z.union([z.string(), zloosen(z.object({ '#text': z.string() }))]))
      .optional(),
  }),
);

export type MarkProtectionTypeXml = z.infer<typeof MarkProtectionTypeXml>;
