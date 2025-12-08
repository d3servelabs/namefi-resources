/**
 * Layer-1 XML JSON schema for type secDNS:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const SecDNSChgTypeXml = z.object({
  'secDNS:maxSigLife': z
    .string()
    .regex(/^-?\d+$/)
    .optional(),
});

export type SecDNSChgTypeXml = z.infer<typeof SecDNSChgTypeXml>;
