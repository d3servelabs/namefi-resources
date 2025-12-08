/**
 * Layer-1 XML JSON schema for <contact:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactChkDataTypeXml } from '../types/contact.chkDataType.layer1';

export const ContactChkDataXml = ContactChkDataTypeXml;

export type ContactChkDataXml = z.infer<typeof ContactChkDataXml>;
