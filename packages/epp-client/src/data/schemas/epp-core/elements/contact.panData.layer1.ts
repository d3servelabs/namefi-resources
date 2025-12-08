/**
 * Layer-1 XML JSON schema for <contact:panData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactPanDataTypeXml } from '../types/contact.panDataType.layer1';

export const ContactPanDataXml = ContactPanDataTypeXml;

export type ContactPanDataXml = z.infer<typeof ContactPanDataXml>;
