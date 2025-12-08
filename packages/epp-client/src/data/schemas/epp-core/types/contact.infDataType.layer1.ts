/**
 * Layer-1 XML JSON schema for type contact:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactStatusTypeXml } from './contact.statusType.layer1.js';
import { ContactPostalInfoTypeXml } from './contact.postalInfoType.layer1.js';
import { ContactE164TypeXml } from './contact.e164Type.layer1.js';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1.js';

export const ContactInfDataTypeXml = zloosen(
  z.object({
    'contact:id': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:roid': z.union([
      z.string().regex(/(\w|_){1,80}-\w{1,8}/),
      zloosen(z.object({ '#text': z.string().regex(/(\w|_){1,80}-\w{1,8}/) })),
    ]),
    'contact:status': z.array(ContactStatusTypeXml).min(1),
    'contact:postalInfo': z.array(ContactPostalInfoTypeXml).min(1),
    'contact:voice': ContactE164TypeXml.optional(),
    'contact:fax': ContactE164TypeXml.optional(),
    'contact:email': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
    'contact:clID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:crID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'contact:crDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'contact:upID': z
      .union([
        z.string().min(3).max(64),
        zloosen(z.object({ '#text': z.string().min(3).max(64) })),
      ])
      .optional(),
    'contact:upDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'contact:trDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'contact:authInfo': ContactAuthInfoTypeXml.optional(),
    'contact:disclose': ContactDiscloseTypeXml.optional(),
  }),
);

export type ContactInfDataTypeXml = z.infer<typeof ContactInfDataTypeXml>;
