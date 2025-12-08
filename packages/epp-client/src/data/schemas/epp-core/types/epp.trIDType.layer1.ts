/**
 * Layer-1 XML JSON schema for type epp:trIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppTrIDTypeXml = z.object({
  'epp:clTRID': z.string().min(0).max(64).optional(),
  'epp:svTRID': z.string().min(0).max(64),
});

export type EppTrIDTypeXml = z.infer<typeof EppTrIDTypeXml>;
