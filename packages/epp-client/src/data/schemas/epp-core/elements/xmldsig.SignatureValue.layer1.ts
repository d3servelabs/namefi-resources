/**
 * Layer-1 XML JSON schema for <xmldsig:SignatureValue>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigSignatureValueTypeXml } from '../types/xmldsig.SignatureValueType.layer1.js';

export const XmldsigSignatureValueXml = XmldsigSignatureValueTypeXml;

export type XmldsigSignatureValueXml = z.infer<typeof XmldsigSignatureValueXml>;
