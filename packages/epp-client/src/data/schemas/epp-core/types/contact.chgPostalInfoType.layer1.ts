/**
 * Layer-1 XML JSON schema for type contact:chgPostalInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactAddrTypeXml } from './contact.addrType.layer1';

export const ContactChgPostalInfoTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['loc', 'int']),
    'contact:name': zloosen(
      z.object({ '#text': z.string().min(1).max(255) }),
    ).optional(),
    'contact:org': zloosen(
      z.object({ '#text': z.string().max(255) }),
    ).optional(),
    'contact:addr': ContactAddrTypeXml.optional(),
  }),
);

export type ContactChgPostalInfoTypeXml = z.infer<
  typeof ContactChgPostalInfoTypeXml
>;
