/**
 * Layer-1 XML JSON schema for <contact:creData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactCreDataTypeXml } from '../types/contact.creDataType.layer1.js';

export const ContactCreDataXml = ContactCreDataTypeXml;

export type ContactCreDataXml = z.infer<typeof ContactCreDataXml>;
