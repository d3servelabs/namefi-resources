/**
 * Layer-1 XML JSON schema for type contact:postalInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactAddrTypeXml } from './contact.addrType.layer1.js';

export const ContactPostalInfoTypeXml = z.object({
  '@_type': z.enum(['loc', 'int']),
  'contact:name': z.string().min(1).max(255),
  'contact:org': z.string().max(255).optional(),
  'contact:addr': ContactAddrTypeXml,
});

export type ContactPostalInfoTypeXml = z.infer<typeof ContactPostalInfoTypeXml>;
