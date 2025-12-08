/**
 * Layer-1 XML JSON schema for <xmldsig:SignatureMethod>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigSignatureMethodTypeXml } from '../types/xmldsig.SignatureMethodType.layer1.js';

export const XmldsigSignatureMethodXml = XmldsigSignatureMethodTypeXml;

export type XmldsigSignatureMethodXml = z.infer<
  typeof XmldsigSignatureMethodXml
>;
