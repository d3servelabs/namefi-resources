/**
 * Layer-1 XML JSON schema for <xmldsig:DSAKeyValue>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigDSAKeyValueTypeXml } from '../types/xmldsig.DSAKeyValueType.layer1.js';

export const XmldsigDSAKeyValueXml = XmldsigDSAKeyValueTypeXml;

export type XmldsigDSAKeyValueXml = z.infer<typeof XmldsigDSAKeyValueXml>;
