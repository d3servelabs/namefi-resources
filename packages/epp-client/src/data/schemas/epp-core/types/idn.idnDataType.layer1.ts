/**
 * Layer-1 XML JSON schema for type idn:idnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const IdnIdnDataTypeXml = zloosen(
  z.object({
    'idn:table': zloosen(z.object({ '#text': z.string().min(1) })),
    'idn:uname': zloosen(
      z.object({ '#text': z.string().min(1).max(255) }),
    ).optional(),
  }),
);

export type IdnIdnDataTypeXml = z.infer<typeof IdnIdnDataTypeXml>;
