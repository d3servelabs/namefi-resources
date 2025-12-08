/**
 * Layer-1 XML JSON schema for <contact:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactUpdateTypeXml } from '../types/contact.updateType.layer1.js';

export const ContactUpdateXml = ContactUpdateTypeXml;

export type ContactUpdateXml = z.infer<typeof ContactUpdateXml>;
