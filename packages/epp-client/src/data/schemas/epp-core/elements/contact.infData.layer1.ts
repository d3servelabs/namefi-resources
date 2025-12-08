/**
 * Layer-1 XML JSON schema for <contact:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactInfDataTypeXml } from '../types/contact.infDataType.layer1';

export const ContactInfDataXml = ContactInfDataTypeXml;

export type ContactInfDataXml = z.infer<typeof ContactInfDataXml>;
