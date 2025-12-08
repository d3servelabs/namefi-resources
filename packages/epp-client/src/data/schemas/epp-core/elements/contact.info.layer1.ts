/**
 * Layer-1 XML JSON schema for <contact:info>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactAuthIDTypeXml } from '../types/contact.authIDType.layer1.js';

export const ContactInfoXml = ContactAuthIDTypeXml;

export type ContactInfoXml = z.infer<typeof ContactInfoXml>;
