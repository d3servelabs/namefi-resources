/**
 * Layer-1 XML JSON schema for type contact:discloseType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactIntLocTypeXml } from './contact.intLocType.layer1.js';

export const ContactDiscloseTypeXml = zloosen(
  z.object({
    '@_flag': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
    'contact:name': z.array(ContactIntLocTypeXml).optional(),
    'contact:org': z.array(ContactIntLocTypeXml).optional(),
    'contact:addr': z.array(ContactIntLocTypeXml).optional(),
    'contact:voice': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'contact:fax': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'contact:email': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type ContactDiscloseTypeXml = z.infer<typeof ContactDiscloseTypeXml>;
