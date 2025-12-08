/**
 * Layer-1 XML JSON schema for <contact:create>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactCreateTypeXml } from '../types/contact.createType.layer1.js';

export const ContactCreateXml = ContactCreateTypeXml;

export type ContactCreateXml = z.infer<typeof ContactCreateXml>;
