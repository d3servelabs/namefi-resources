/**
 * Layer-1 XML JSON schema for <contact:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ContactChkDataTypeXml } from '../types/contact.chkDataType.layer1.js';

export const ContactChkDataXml = ContactChkDataTypeXml;

export type ContactChkDataXml = z.infer<typeof ContactChkDataXml>;
