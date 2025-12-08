/**
 * Layer-1 XML JSON schema for type contact:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactCheckIDTypeXml } from './contact.checkIDType.layer1.js';
import { EppcomReasonTypeXml } from './eppcom.reasonType.layer1.js';

export const ContactCheckTypeXml = zloosen(
  z.object({
    'contact:id': ContactCheckIDTypeXml,
    'contact:reason': EppcomReasonTypeXml.optional(),
  }),
);

export type ContactCheckTypeXml = z.infer<typeof ContactCheckTypeXml>;
