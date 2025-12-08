/**
 * Layer-1 XML JSON schema for <contact:delete>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactSIDTypeXml } from '../types/contact.sIDType.layer1';

export const ContactDeleteXml = ContactSIDTypeXml;

export type ContactDeleteXml = z.infer<typeof ContactDeleteXml>;
