/**
 * Layer-1 XML JSON schema for type contact:mIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactMIDTypeXml = z.object({
  'contact:id': z.array(z.string().min(3).max(64)).min(1),
});

export type ContactMIDTypeXml = z.infer<typeof ContactMIDTypeXml>;
