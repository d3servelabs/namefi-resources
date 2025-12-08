/**
 * Layer-1 XML JSON schema for type xmldsig:X509DataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigX509IssuerSerialTypeXml } from './xmldsig.X509IssuerSerialType.layer1';

export const XmldsigX509DataTypeXml = z.union([
  zloosen(
    z.object({
      'xmldsig:X509IssuerSerial': XmldsigX509IssuerSerialTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509SKI': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509SubjectName': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509Certificate': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509CRL': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
]);

export type XmldsigX509DataTypeXml = z.infer<typeof XmldsigX509DataTypeXml>;
