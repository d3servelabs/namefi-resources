/**
 * Layer-1 XML JSON schema for type contact:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactPostalInfoTypeXml } from './contact.postalInfoType.layer1';
import { ContactE164TypeXml } from './contact.e164Type.layer1';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1';

export const ContactCreateTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:postalInfo': z.array(ContactPostalInfoTypeXml).min(1),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': zloosen(z.object({ '#text': z.string().min(1) })),
    'contact:authInfo': ContactAuthInfoTypeXml,
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactCreateTypeXml = z.infer<typeof ContactCreateTypeXml>;
