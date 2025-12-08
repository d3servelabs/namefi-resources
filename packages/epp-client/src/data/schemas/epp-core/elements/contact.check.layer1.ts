/**
 * Layer-1 XML JSON schema for <contact:check>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactMIDTypeXml } from '../types/contact.mIDType.layer1';

export const ContactCheckXml = ContactMIDTypeXml;

export type ContactCheckXml = z.infer<typeof ContactCheckXml>;
