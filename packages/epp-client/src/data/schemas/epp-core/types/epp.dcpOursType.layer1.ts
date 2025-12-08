/**
 * Layer-1 XML JSON schema for type epp:dcpOursType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppDcpOursTypeXml = zloosen(
  z.object({
    'epp:recDesc': z
      .union([
        z.string().min(1).max(255),
        zloosen(z.object({ '#text': z.string().min(1).max(255) })),
      ])
      .optional(),
  }),
);

export type EppDcpOursTypeXml = z.infer<typeof EppDcpOursTypeXml>;
