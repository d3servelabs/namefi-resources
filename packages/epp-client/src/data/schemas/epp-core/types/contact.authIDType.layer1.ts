/**
 * Layer-1 XML JSON schema for type contact:authIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1';

export const ContactAuthIDTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
  }),
);

export type ContactAuthIDTypeXml = z.infer<typeof ContactAuthIDTypeXml>;
