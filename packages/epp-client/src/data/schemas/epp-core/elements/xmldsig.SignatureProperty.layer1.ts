/**
 * Layer-1 XML JSON schema for <xmldsig:SignatureProperty>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigSignaturePropertyTypeXml } from '../types/xmldsig.SignaturePropertyType.layer1';

export const XmldsigSignaturePropertyXml = XmldsigSignaturePropertyTypeXml;

export type XmldsigSignaturePropertyXml = z.infer<
  typeof XmldsigSignaturePropertyXml
>;
