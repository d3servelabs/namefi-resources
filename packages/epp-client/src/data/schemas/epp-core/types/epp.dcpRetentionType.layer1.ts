/**
 * Layer-1 XML JSON schema for type epp:dcpRetentionType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppDcpRetentionTypeXml = z.union([
  zloosen(
    z.object({
      'epp:business': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:indefinite': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:legal': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:none': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:stated': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
]);

export type EppDcpRetentionTypeXml = z.infer<typeof EppDcpRetentionTypeXml>;
