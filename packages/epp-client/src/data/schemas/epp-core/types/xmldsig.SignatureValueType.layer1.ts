/**
 * Layer-1 XML JSON schema for type xmldsig:SignatureValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigSignatureValueTypeXml = z.object({
  '@_Id': z.string().optional(),
  '#text': z.string(),
});

export type XmldsigSignatureValueTypeXml = z.infer<
  typeof XmldsigSignatureValueTypeXml
>;
