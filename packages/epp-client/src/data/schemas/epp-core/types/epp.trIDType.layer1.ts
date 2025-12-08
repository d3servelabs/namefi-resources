/**
 * Layer-1 XML JSON schema for type epp:trIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppTrIDTypeXml = zloosen(
  z.object({
    'epp:clTRID': zloosen(
      z.object({ '#text': z.string().min(0).max(64) }),
    ).optional(),
    'epp:svTRID': zloosen(z.object({ '#text': z.string().min(0).max(64) })),
  }),
);

export type EppTrIDTypeXml = z.infer<typeof EppTrIDTypeXml>;
