/**
 * Layer-1 XML JSON schema for type xmldsig:X509DataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { XmldsigX509IssuerSerialTypeXml } from './xmldsig.X509IssuerSerialType.layer1.js';

export const XmldsigX509DataTypeXml = z.union([
  z.object({
    'xmldsig:X509IssuerSerial': XmldsigX509IssuerSerialTypeXml,
  }),
  z.object({
    'xmldsig:X509SKI': z.string(),
  }),
  z.object({
    'xmldsig:X509SubjectName': z.string(),
  }),
  z.object({
    'xmldsig:X509Certificate': z.string(),
  }),
  z.object({
    'xmldsig:X509CRL': z.string(),
  }),
]);

export type XmldsigX509DataTypeXml = z.infer<typeof XmldsigX509DataTypeXml>;
