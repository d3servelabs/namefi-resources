/**
 * Layer-1 XML JSON schema for <xmldsig:PGPData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigPGPDataTypeXml } from '../types/xmldsig.PGPDataType.layer1.js';

export const XmldsigPGPDataXml = XmldsigPGPDataTypeXml;

export type XmldsigPGPDataXml = z.infer<typeof XmldsigPGPDataXml>;
