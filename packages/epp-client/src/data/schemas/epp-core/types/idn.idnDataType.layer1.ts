/**
 * Layer-1 XML JSON schema for type idn:idnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const IdnIdnDataTypeXml = z.object({
  'idn:table': z.string().min(1),
  'idn:uname': z.string().min(1).max(255).optional(),
});

export type IdnIdnDataTypeXml = z.infer<typeof IdnIdnDataTypeXml>;
