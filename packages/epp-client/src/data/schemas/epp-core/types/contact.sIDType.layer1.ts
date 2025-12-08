/**
 * Layer-1 XML JSON schema for type contact:sIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactSIDTypeXml = z.object({
  'contact:id': z.string().min(3).max(64),
});

export type ContactSIDTypeXml = z.infer<typeof ContactSIDTypeXml>;
