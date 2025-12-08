/**
 * Layer-1 XML JSON schema for <xmldsig:RSAKeyValue>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigRSAKeyValueTypeXml } from '../types/xmldsig.RSAKeyValueType.layer1.js';

export const XmldsigRSAKeyValueXml = XmldsigRSAKeyValueTypeXml;

export type XmldsigRSAKeyValueXml = z.infer<typeof XmldsigRSAKeyValueXml>;
