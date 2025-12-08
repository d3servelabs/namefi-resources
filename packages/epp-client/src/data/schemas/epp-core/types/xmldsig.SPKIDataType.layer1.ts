/**
 * Layer-1 XML JSON schema for type xmldsig:SPKIDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigSPKIDataTypeXml = zloosen(
  z.object({
    'xmldsig:SPKISexp': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type XmldsigSPKIDataTypeXml = z.infer<typeof XmldsigSPKIDataTypeXml>;
