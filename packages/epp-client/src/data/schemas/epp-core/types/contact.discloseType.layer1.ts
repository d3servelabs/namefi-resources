/**
 * Layer-1 XML JSON schema for type contact:discloseType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactIntLocTypeXml } from './contact.intLocType.layer1';

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
    'contact:voice': zloosen(z.object({ '#text': z.string() })).optional(),
    'contact:fax': zloosen(z.object({ '#text': z.string() })).optional(),
    'contact:email': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type ContactDiscloseTypeXml = z.infer<typeof ContactDiscloseTypeXml>;
