/**
 * Layer-1 XML JSON schema for type contact:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactChgPostalInfoTypeXml } from './contact.chgPostalInfoType.layer1.js';
import { ContactE164TypeXml } from './contact.e164Type.layer1.js';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1.js';

export const ContactChgTypeXml = zloosen(
  z.object({
    'contact:postalInfo': z.array(ContactChgPostalInfoTypeXml).optional(),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': z
      .union([
        z.string().min(1),
        zloosen(z.object({ '#text': z.string().min(1) })),
      ])
      .optional(),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactChgTypeXml = z.infer<typeof ContactChgTypeXml>;
