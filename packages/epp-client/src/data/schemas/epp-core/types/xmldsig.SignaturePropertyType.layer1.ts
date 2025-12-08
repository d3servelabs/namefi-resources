/**
 * Layer-1 XML JSON schema for type xmldsig:SignaturePropertyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigSignaturePropertyTypeXml = z.object({
  '@_Target': z.string(),
  '@_Id': z.string().optional(),
  '#text': z.string().optional(),
});

export type XmldsigSignaturePropertyTypeXml = z.infer<
  typeof XmldsigSignaturePropertyTypeXml
>;
