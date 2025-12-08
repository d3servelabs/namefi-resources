/**
 * Layer-1 XML JSON schema for <xmldsig:KeyValue>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigKeyValueTypeXml } from '../types/xmldsig.KeyValueType.layer1.js';

export const XmldsigKeyValueXml = XmldsigKeyValueTypeXml;

export type XmldsigKeyValueXml = z.infer<typeof XmldsigKeyValueXml>;
