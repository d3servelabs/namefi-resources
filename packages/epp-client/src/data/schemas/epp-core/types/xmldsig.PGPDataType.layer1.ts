/**
 * Layer-1 XML JSON schema for type xmldsig:PGPDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const XmldsigPGPDataTypeXml = z.union([
  z.object({
    'xmldsig:PGPKeyID': z.string(),
    'xmldsig:PGPKeyPacket': z.string().optional(),
  }),
  z.object({
    'xmldsig:PGPKeyPacket': z.string(),
  }),
]);

export type XmldsigPGPDataTypeXml = z.infer<typeof XmldsigPGPDataTypeXml>;
