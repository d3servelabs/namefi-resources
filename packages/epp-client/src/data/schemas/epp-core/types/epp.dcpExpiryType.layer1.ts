/**
 * Layer-1 XML JSON schema for type epp:dcpExpiryType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppDcpExpiryTypeXml = z.union([
  z.object({
    'epp:absolute': z.string(),
  }),
  z.object({
    'epp:relative': z.string(),
  }),
]);

export type EppDcpExpiryTypeXml = z.infer<typeof EppDcpExpiryTypeXml>;
