/**
 * Layer-1 XML JSON schema for type xmldsig:PGPDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigPGPDataTypeXml = z.union([
  zloosen(
    z.object({
      'xmldsig:PGPKeyID': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
      'xmldsig:PGPKeyPacket': z
        .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
        .optional(),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:PGPKeyPacket': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
]);

export type XmldsigPGPDataTypeXml = z.infer<typeof XmldsigPGPDataTypeXml>;
