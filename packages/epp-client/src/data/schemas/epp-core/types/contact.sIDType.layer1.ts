/**
 * Layer-1 XML JSON schema for type contact:sIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ContactSIDTypeXml = zloosen(
  z.object({
    'contact:id': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
  }),
);

export type ContactSIDTypeXml = z.infer<typeof ContactSIDTypeXml>;
