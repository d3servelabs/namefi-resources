/**
 * Layer-1 XML JSON schema for type contact:addRemType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactStatusTypeXml } from './contact.statusType.layer1.js';

export const ContactAddRemTypeXml = z.object({
  'contact:status': z.array(ContactStatusTypeXml).min(1),
});

export type ContactAddRemTypeXml = z.infer<typeof ContactAddRemTypeXml>;
