/**
 * Layer-1 XML JSON schema for type contact:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactChgPostalInfoTypeXml } from './contact.chgPostalInfoType.layer1';
import { ContactE164TypeXml } from './contact.e164Type.layer1';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1';

export const ContactChgTypeXml = zloosen(
  z.object({
    'contact:postalInfo': z.array(ContactChgPostalInfoTypeXml).optional(),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': zloosen(
      z.object({ '#text': z.string().min(1) }),
    ).optional(),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactChgTypeXml = z.infer<typeof ContactChgTypeXml>;
