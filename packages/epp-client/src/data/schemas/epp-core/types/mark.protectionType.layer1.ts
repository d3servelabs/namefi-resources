/**
 * Layer-1 XML JSON schema for type mark:protectionType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const MarkProtectionTypeXml = zloosen(
  z.object({
    'mark:cc': zloosen(z.object({ '#text': z.string() })),
    'mark:region': zloosen(z.object({ '#text': z.string() })).optional(),
    'mark:ruling': z
      .array(zloosen(z.object({ '#text': z.string() })))
      .optional(),
  }),
);

export type MarkProtectionTypeXml = z.infer<typeof MarkProtectionTypeXml>;
