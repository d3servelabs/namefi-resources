/**
 * Layer-1 XML JSON schema for <contact:info>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactAuthIDTypeXml } from '../types/contact.authIDType.layer1';

export const ContactInfoXml = ContactAuthIDTypeXml;

export type ContactInfoXml = z.infer<typeof ContactInfoXml>;
