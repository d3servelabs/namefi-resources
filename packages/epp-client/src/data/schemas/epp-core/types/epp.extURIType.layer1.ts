/**
 * Layer-1 XML JSON schema for type epp:extURIType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppExtURITypeXml = zloosen(
  z.object({
    'epp:extURI': z.array(zloosen(z.object({ '#text': z.string() }))).min(1),
  }),
);

export type EppExtURITypeXml = z.infer<typeof EppExtURITypeXml>;
