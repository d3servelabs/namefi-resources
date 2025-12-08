/**
 * Layer-1 XML JSON schema for type xmldsig:DSAKeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigDSAKeyValueTypeXml = z.object({
  'xmldsig:G': z.string().optional(),
  'xmldsig:Y': z.string(),
  'xmldsig:J': z.string().optional(),
  'xmldsig:P': z.string(),
  'xmldsig:Q': z.string(),
  'xmldsig:Seed': z.string(),
  'xmldsig:PgenCounter': z.string(),
});

export type XmldsigDSAKeyValueTypeXml = z.infer<
  typeof XmldsigDSAKeyValueTypeXml
>;
