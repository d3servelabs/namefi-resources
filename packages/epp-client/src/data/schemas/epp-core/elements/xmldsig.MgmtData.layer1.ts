/**
 * Layer-1 XML JSON schema for <xmldsig:MgmtData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigMgmtDataXml = z.string();

export type XmldsigMgmtDataXml = z.infer<typeof XmldsigMgmtDataXml>;
