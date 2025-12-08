/**
 * Layer-1 XML JSON schema for type epp:credsOptionsType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppCredsOptionsTypeXml = z.object({
  'epp:version': z.enum(['1.0']),
  'epp:lang': z.string(),
});

export type EppCredsOptionsTypeXml = z.infer<typeof EppCredsOptionsTypeXml>;
