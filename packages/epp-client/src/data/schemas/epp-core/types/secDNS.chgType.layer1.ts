/**
 * Layer-1 XML JSON schema for type secDNS:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const SecDNSChgTypeXml = zloosen(
  z.object({
    'secDNS:maxSigLife': z
      .union([
        z.string().regex(/^-?\d+$/),
        zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
      ])
      .optional(),
  }),
);

export type SecDNSChgTypeXml = z.infer<typeof SecDNSChgTypeXml>;
