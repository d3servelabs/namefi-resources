/**
 * Layer-1 XML JSON schema for type epp:credsOptionsType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppCredsOptionsTypeXml = zloosen(
  z.object({
    'epp:version': z.union([
      z.enum(['1.0']),
      zloosen(z.object({ '#text': z.enum(['1.0']) })),
    ]),
    'epp:lang': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type EppCredsOptionsTypeXml = z.infer<typeof EppCredsOptionsTypeXml>;
