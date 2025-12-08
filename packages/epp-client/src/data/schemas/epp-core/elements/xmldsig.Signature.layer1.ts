/**
 * Layer-1 XML JSON schema for <xmldsig:Signature>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigSignatureTypeXml } from '../types/xmldsig.SignatureType.layer1';

export const XmldsigSignatureXml = XmldsigSignatureTypeXml;

export type XmldsigSignatureXml = z.infer<typeof XmldsigSignatureXml>;
