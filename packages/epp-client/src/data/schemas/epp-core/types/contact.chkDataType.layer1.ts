/**
 * Layer-1 XML JSON schema for type contact:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactCheckTypeXml } from './contact.checkType.layer1.js';

export const ContactChkDataTypeXml = z.object({
  'contact:cd': z.array(ContactCheckTypeXml).min(1),
});

export type ContactChkDataTypeXml = z.infer<typeof ContactChkDataTypeXml>;
