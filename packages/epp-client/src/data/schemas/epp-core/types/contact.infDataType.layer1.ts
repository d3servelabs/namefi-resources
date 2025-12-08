/**
 * Layer-1 XML JSON schema for type contact:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactStatusTypeXml } from './contact.statusType.layer1';
import { ContactPostalInfoTypeXml } from './contact.postalInfoType.layer1';
import { ContactE164TypeXml } from './contact.e164Type.layer1';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1';

export const ContactInfDataTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:roid': zloosen(
      z.object({ '#text': z.string().regex(/(\w|_){1,80}-\w{1,8}/) }),
    ),
    'contact:status': z.array(ContactStatusTypeXml).min(1),
    'contact:postalInfo': z.array(ContactPostalInfoTypeXml).min(1),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': zloosen(z.object({ '#text': z.string().min(1) })),
    'contact:clID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:crID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:crDate': zloosen(z.object({ '#text': z.string() })),
    'contact:upID': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'contact:upDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'contact:trDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactInfDataTypeXml = z.infer<typeof ContactInfDataTypeXml>;
