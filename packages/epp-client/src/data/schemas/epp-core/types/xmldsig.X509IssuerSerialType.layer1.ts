/**
 * Layer-1 XML JSON schema for type xmldsig:X509IssuerSerialType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigX509IssuerSerialTypeXml = z.object({
  'xmldsig:X509IssuerName': z.string(),
  'xmldsig:X509SerialNumber': z.string().regex(/^-?\d+$/),
});

export type XmldsigX509IssuerSerialTypeXml = z.infer<
  typeof XmldsigX509IssuerSerialTypeXml
>;
