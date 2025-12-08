/**
 * Layer-1 XML JSON schema for type secDNS:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const SecDNSChgTypeXml = zloosen(
  z.object({
    'secDNS:maxSigLife': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ).optional(),
  }),
);

export type SecDNSChgTypeXml = z.infer<typeof SecDNSChgTypeXml>;
