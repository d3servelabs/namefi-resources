/**
 * Layer-1 XML JSON schema for type epp:dcpExpiryType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppDcpExpiryTypeXml = z.union([
  zloosen(
    z.object({
      'epp:absolute': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:relative': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
]);

export type EppDcpExpiryTypeXml = z.infer<typeof EppDcpExpiryTypeXml>;
