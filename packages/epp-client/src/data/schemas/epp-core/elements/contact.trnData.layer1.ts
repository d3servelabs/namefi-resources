/**
 * Layer-1 XML JSON schema for <contact:trnData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactTrnDataTypeXml } from '../types/contact.trnDataType.layer1';

export const ContactTrnDataXml = ContactTrnDataTypeXml;

export type ContactTrnDataXml = z.infer<typeof ContactTrnDataXml>;
