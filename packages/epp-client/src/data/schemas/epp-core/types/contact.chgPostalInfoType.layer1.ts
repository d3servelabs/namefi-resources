/**
 * Layer-1 XML JSON schema for type contact:chgPostalInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactAddrTypeXml } from './contact.addrType.layer1.js';

export const ContactChgPostalInfoTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['loc', 'int']),
    'contact:name': z
      .union([
        z.string().min(1).max(255),
        zloosen(z.object({ '#text': z.string().min(1).max(255) })),
      ])
      .optional(),
    'contact:org': z
      .union([
        z.string().max(255),
        zloosen(z.object({ '#text': z.string().max(255) })),
      ])
      .optional(),
    'contact:addr': ContactAddrTypeXml.optional(),
  }),
);

export type ContactChgPostalInfoTypeXml = z.infer<
  typeof ContactChgPostalInfoTypeXml
>;
