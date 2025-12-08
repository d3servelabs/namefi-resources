/**
 * Layer-1 XML JSON schema for type epp:trIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppTrIDTypeXml = zloosen(
  z.object({
    'epp:clTRID': z
      .union([
        z.string().min(0).max(64),
        zloosen(z.object({ '#text': z.string().min(0).max(64) })),
      ])
      .optional(),
    'epp:svTRID': z.union([
      z.string().min(0).max(64),
      zloosen(z.object({ '#text': z.string().min(0).max(64) })),
    ]),
  }),
);

export type EppTrIDTypeXml = z.infer<typeof EppTrIDTypeXml>;
