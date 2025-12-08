/**
 * Layer-1 XML JSON schema for type epp:extURIType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppExtURITypeXml = z.object({
  'epp:extURI': z.array(z.string()).min(1),
});

export type EppExtURITypeXml = z.infer<typeof EppExtURITypeXml>;
