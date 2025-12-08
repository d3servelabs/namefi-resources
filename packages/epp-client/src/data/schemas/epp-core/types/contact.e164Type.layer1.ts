/**
 * Layer-1 XML JSON schema for type contact:e164Type.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ContactE164TypeXml = zloosen(
  z.object({
    '@_x': z.string().optional(),
    '#text': z.string().regex(/(\+[0-9]{1,3}\.[0-9]{1,14})?/),
  }),
);

export type ContactE164TypeXml = z.infer<typeof ContactE164TypeXml>;
