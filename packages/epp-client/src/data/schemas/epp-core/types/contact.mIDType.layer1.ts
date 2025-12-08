/**
 * Layer-1 XML JSON schema for type contact:mIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ContactMIDTypeXml = zloosen(
  z.object({
    'contact:id': z
      .array(zloosen(z.object({ '#text': z.string().min(3).max(64) })))
      .min(1),
  }),
);

export type ContactMIDTypeXml = z.infer<typeof ContactMIDTypeXml>;
