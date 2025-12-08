/**
 * Layer-1 XML JSON schema for type contact:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactPostalInfoTypeXml } from './contact.postalInfoType.layer1.js';
import { ContactE164TypeXml } from './contact.e164Type.layer1.js';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1.js';

export const ContactCreateTypeXml = zloosen(
  z.object({
    'contact:id': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:postalInfo': z.array(ContactPostalInfoTypeXml).min(1),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
    'contact:authInfo': ContactAuthInfoTypeXml,
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactCreateTypeXml = z.infer<typeof ContactCreateTypeXml>;
