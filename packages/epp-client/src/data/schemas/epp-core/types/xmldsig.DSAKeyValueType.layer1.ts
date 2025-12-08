/**
 * Layer-1 XML JSON schema for type xmldsig:DSAKeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigDSAKeyValueTypeXml = zloosen(
  z.object({
    'xmldsig:G': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'xmldsig:Y': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'xmldsig:J': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'xmldsig:P': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'xmldsig:Q': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'xmldsig:Seed': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'xmldsig:PgenCounter': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type XmldsigDSAKeyValueTypeXml = z.infer<
  typeof XmldsigDSAKeyValueTypeXml
>;
