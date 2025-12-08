/**
 * Layer-1 XML JSON schema for type idn:idnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const IdnIdnDataTypeXml = zloosen(
  z.object({
    'idn:table': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
    'idn:uname': z
      .union([
        z.string().min(1).max(255),
        zloosen(z.object({ '#text': z.string().min(1).max(255) })),
      ])
      .optional(),
  }),
);

export type IdnIdnDataTypeXml = z.infer<typeof IdnIdnDataTypeXml>;
