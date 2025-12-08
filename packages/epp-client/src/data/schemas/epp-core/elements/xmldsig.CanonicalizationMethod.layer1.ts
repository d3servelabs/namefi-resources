/**
 * Layer-1 XML JSON schema for <xmldsig:CanonicalizationMethod>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigCanonicalizationMethodTypeXml } from '../types/xmldsig.CanonicalizationMethodType.layer1.js';

export const XmldsigCanonicalizationMethodXml =
  XmldsigCanonicalizationMethodTypeXml;

export type XmldsigCanonicalizationMethodXml = z.infer<
  typeof XmldsigCanonicalizationMethodXml
>;
