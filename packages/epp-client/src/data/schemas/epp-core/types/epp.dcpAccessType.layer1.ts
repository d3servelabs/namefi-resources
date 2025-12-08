/**
 * Layer-1 XML JSON schema for type epp:dcpAccessType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppDcpAccessTypeXml = z.union([
  zloosen(
    z.object({
      'epp:all': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:none': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:null': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:other': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:personal': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:personalAndOther': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
]);

export type EppDcpAccessTypeXml = z.infer<typeof EppDcpAccessTypeXml>;
