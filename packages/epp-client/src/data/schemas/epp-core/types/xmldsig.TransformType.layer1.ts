/**
 * Layer-1 XML JSON schema for type xmldsig:TransformType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigTransformTypeXml = z.object({
  '@_Algorithm': z.string(),
  '#text': z.string().optional(),
  'xmldsig:XPath': z.string(),
});

export type XmldsigTransformTypeXml = z.infer<typeof XmldsigTransformTypeXml>;
