/**
 * Layer-1 XML JSON schema for type xmldsig:RSAKeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigRSAKeyValueTypeXml = z.object({
  'xmldsig:Modulus': z.string(),
  'xmldsig:Exponent': z.string(),
});

export type XmldsigRSAKeyValueTypeXml = z.infer<
  typeof XmldsigRSAKeyValueTypeXml
>;
