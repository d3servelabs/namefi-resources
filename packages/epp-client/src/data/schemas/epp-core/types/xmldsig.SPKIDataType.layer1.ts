/**
 * Layer-1 XML JSON schema for type xmldsig:SPKIDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigSPKIDataTypeXml = z.object({
  'xmldsig:SPKISexp': z.string(),
});

export type XmldsigSPKIDataTypeXml = z.infer<typeof XmldsigSPKIDataTypeXml>;
