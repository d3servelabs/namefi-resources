/**
 * Layer-1 XML JSON schema for type xmldsig:RSAKeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigRSAKeyValueTypeXml = zloosen(
  z.object({
    'xmldsig:Modulus': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'xmldsig:Exponent': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type XmldsigRSAKeyValueTypeXml = z.infer<
  typeof XmldsigRSAKeyValueTypeXml
>;
