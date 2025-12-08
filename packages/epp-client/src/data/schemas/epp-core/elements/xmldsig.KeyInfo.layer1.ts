/**
 * Layer-1 XML JSON schema for <xmldsig:KeyInfo>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigKeyInfoTypeXml } from '../types/xmldsig.KeyInfoType.layer1';

export const XmldsigKeyInfoXml = XmldsigKeyInfoTypeXml;

export type XmldsigKeyInfoXml = z.infer<typeof XmldsigKeyInfoXml>;
