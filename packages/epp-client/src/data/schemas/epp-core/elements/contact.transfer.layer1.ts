/**
 * Layer-1 XML JSON schema for <contact:transfer>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { ContactAuthIDTypeXml } from '../types/contact.authIDType.layer1.js';

export const ContactTransferXml = ContactAuthIDTypeXml;

export type ContactTransferXml = z.infer<typeof ContactTransferXml>;
