/**
 * Layer-1 XML JSON schema for type xmldsig:PGPDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigPGPDataTypeXml = z.union([
  zloosen(
    z.object({
      'xmldsig:PGPKeyID': zloosen(z.object({ '#text': z.string() })),
      'xmldsig:PGPKeyPacket': zloosen(
        z.object({ '#text': z.string() }),
      ).optional(),
    }),
  ),
  zloosen(
    z.object({
      'xmldsig:PGPKeyPacket': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
]);

export type XmldsigPGPDataTypeXml = z.infer<typeof XmldsigPGPDataTypeXml>;
