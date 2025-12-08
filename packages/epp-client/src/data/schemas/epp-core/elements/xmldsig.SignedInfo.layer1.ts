/**
 * Layer-1 XML JSON schema for <xmldsig:SignedInfo>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigSignedInfoTypeXml } from '../types/xmldsig.SignedInfoType.layer1';

export const XmldsigSignedInfoXml = XmldsigSignedInfoTypeXml;

export type XmldsigSignedInfoXml = z.infer<typeof XmldsigSignedInfoXml>;
