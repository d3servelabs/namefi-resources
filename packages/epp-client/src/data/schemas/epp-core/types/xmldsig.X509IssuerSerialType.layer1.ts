/**
 * Layer-1 XML JSON schema for type xmldsig:X509IssuerSerialType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigX509IssuerSerialTypeXml = zloosen(
  z.object({
    'xmldsig:X509IssuerName': zloosen(z.object({ '#text': z.string() })),
    'xmldsig:X509SerialNumber': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ),
  }),
);

export type XmldsigX509IssuerSerialTypeXml = z.infer<
  typeof XmldsigX509IssuerSerialTypeXml
>;
