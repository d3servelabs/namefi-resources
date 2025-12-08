/**
 * Layer-1 XML JSON schema for type contact:authIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';

export const ContactAuthIDTypeXml = z.object({
  'contact:id': z.string().min(3).max(64),
  'contact:authInfo': ContactAuthInfoTypeXml.optional(),
});

export type ContactAuthIDTypeXml = z.infer<typeof ContactAuthIDTypeXml>;
