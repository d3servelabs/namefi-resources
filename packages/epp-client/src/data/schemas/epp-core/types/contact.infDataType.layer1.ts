/**
 * Layer-1 XML JSON schema for type contact:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactStatusTypeXml } from './contact.statusType.layer1.js';
import { ContactPostalInfoTypeXml } from './contact.postalInfoType.layer1.js';
import { ContactE164TypeXml } from './contact.e164Type.layer1.js';
import { ContactAuthInfoTypeXml } from './contact.authInfoType.layer1.js';
import { ContactDiscloseTypeXml } from './contact.discloseType.layer1.js';

export const ContactInfDataTypeXml = z.object({
  'contact:id': z.string().min(3).max(64),
  'contact:roid': z.string().regex(/(\w|_){1,80}-\w{1,8}/),
  'contact:status': z.array(ContactStatusTypeXml).min(1),
  'contact:postalInfo': z.array(ContactPostalInfoTypeXml).min(1),
  'contact:voice': ContactE164TypeXml.optional(),
  'contact:fax': ContactE164TypeXml.optional(),
  'contact:email': z.string().min(1),
  'contact:clID': z.string().min(3).max(64),
  'contact:crID': z.string().min(3).max(64),
  'contact:crDate': z.string(),
  'contact:upID': z.string().min(3).max(64).optional(),
  'contact:upDate': z.string().optional(),
  'contact:trDate': z.string().optional(),
  'contact:authInfo': ContactAuthInfoTypeXml.optional(),
  'contact:disclose': ContactDiscloseTypeXml.optional(),
});

export type ContactInfDataTypeXml = z.infer<typeof ContactInfDataTypeXml>;
