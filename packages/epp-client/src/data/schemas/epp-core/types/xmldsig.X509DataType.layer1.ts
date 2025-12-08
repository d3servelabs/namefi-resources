/**
 * Layer-1 XML JSON schema for type xmldsig:X509DataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigX509IssuerSerialTypeXml } from './xmldsig.X509IssuerSerialType.layer1.js';

export const XmldsigX509DataTypeXml = z.union([
  zloosen(
    z.object({
      'xmldsig:X509IssuerSerial': XmldsigX509IssuerSerialTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509SKI': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509SubjectName': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509Certificate': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:X509CRL': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
]);

export type XmldsigX509DataTypeXml = z.infer<typeof XmldsigX509DataTypeXml>;
