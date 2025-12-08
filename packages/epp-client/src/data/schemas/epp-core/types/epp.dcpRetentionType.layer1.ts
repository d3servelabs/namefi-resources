/**
 * Layer-1 XML JSON schema for type epp:dcpRetentionType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppDcpRetentionTypeXml = z.union([
  z.object({
    'epp:business': z.string(),
  }),
  z.object({
    'epp:indefinite': z.string(),
  }),
  z.object({
    'epp:legal': z.string(),
  }),
  z.object({
    'epp:none': z.string(),
  }),
  z.object({
    'epp:stated': z.string(),
  }),
]);

export type EppDcpRetentionTypeXml = z.infer<typeof EppDcpRetentionTypeXml>;
