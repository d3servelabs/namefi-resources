/**
 * Layer-1 XML JSON schema for type epp:dcpAccessType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppDcpAccessTypeXml = z.union([
  z.object({
    'epp:all': z.string(),
  }),
  z.object({
    'epp:none': z.string(),
  }),
  z.object({
    'epp:null': z.string(),
  }),
  z.object({
    'epp:other': z.string(),
  }),
  z.object({
    'epp:personal': z.string(),
  }),
  z.object({
    'epp:personalAndOther': z.string(),
  }),
]);

export type EppDcpAccessTypeXml = z.infer<typeof EppDcpAccessTypeXml>;
