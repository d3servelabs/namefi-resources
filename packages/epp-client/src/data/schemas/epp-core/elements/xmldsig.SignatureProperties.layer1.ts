/**
 * Layer-1 XML JSON schema for <xmldsig:SignatureProperties>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigSignaturePropertiesTypeXml } from '../types/xmldsig.SignaturePropertiesType.layer1';

export const XmldsigSignaturePropertiesXml = XmldsigSignaturePropertiesTypeXml;

export type XmldsigSignaturePropertiesXml = z.infer<
  typeof XmldsigSignaturePropertiesXml
>;
