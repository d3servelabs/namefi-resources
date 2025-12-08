/**
 * Layer-1 XML JSON schema for <xmldsig:SPKIData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigSPKIDataTypeXml } from '../types/xmldsig.SPKIDataType.layer1';

export const XmldsigSPKIDataXml = XmldsigSPKIDataTypeXml;

export type XmldsigSPKIDataXml = z.infer<typeof XmldsigSPKIDataXml>;
