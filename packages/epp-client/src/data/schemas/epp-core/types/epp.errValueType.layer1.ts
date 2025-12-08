/**
 * Layer-1 XML JSON schema for type epp:errValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppErrValueTypeXml = z.object({
  '#text': z.string().optional(),
});

export type EppErrValueTypeXml = z.infer<typeof EppErrValueTypeXml>;
