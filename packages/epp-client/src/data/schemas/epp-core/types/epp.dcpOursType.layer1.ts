/**
 * Layer-1 XML JSON schema for type epp:dcpOursType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppDcpOursTypeXml = z.object({
  'epp:recDesc': z.string().min(1).max(255).optional(),
});

export type EppDcpOursTypeXml = z.infer<typeof EppDcpOursTypeXml>;
