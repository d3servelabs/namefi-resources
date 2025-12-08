/**
 * Layer-1 XML JSON schema for type contact:authIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';

export const ContactAuthIDTypeXml = zloosen(
  z.object({
    'contact:id': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
  }),
);

export type ContactAuthIDTypeXml = z.infer<typeof ContactAuthIDTypeXml>;
