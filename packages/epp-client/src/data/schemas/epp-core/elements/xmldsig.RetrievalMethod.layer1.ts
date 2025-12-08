/**
 * Layer-1 XML JSON schema for <xmldsig:RetrievalMethod>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigRetrievalMethodTypeXml } from '../types/xmldsig.RetrievalMethodType.layer1';

export const XmldsigRetrievalMethodXml = XmldsigRetrievalMethodTypeXml;

export type XmldsigRetrievalMethodXml = z.infer<
  typeof XmldsigRetrievalMethodXml
>;
