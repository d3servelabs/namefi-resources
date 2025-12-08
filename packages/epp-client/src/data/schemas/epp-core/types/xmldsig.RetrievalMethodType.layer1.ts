/**
 * Layer-1 XML JSON schema for type xmldsig:RetrievalMethodType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { XmldsigTransformsXml } from '../elements/xmldsig.Transforms.layer1.js';

export const XmldsigRetrievalMethodTypeXml = z.object({
  '@_URI': z.string().optional(),
  '@_Type': z.string().optional(),
  'xmldsig:Transforms': XmldsigTransformsXml.optional(),
});

export type XmldsigRetrievalMethodTypeXml = z.infer<
  typeof XmldsigRetrievalMethodTypeXml
>;
