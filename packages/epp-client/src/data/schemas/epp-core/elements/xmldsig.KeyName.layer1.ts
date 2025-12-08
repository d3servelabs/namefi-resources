/**
 * Layer-1 XML JSON schema for <xmldsig:KeyName>.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigKeyNameXml = z.string();

export type XmldsigKeyNameXml = z.infer<typeof XmldsigKeyNameXml>;
