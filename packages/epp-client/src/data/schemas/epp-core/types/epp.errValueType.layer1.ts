/**
 * Layer-1 XML JSON schema for type epp:errValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppErrValueTypeXml = zloosen(
  z.object({
    '#text': z.string().optional(),
  }),
);

export type EppErrValueTypeXml = z.infer<typeof EppErrValueTypeXml>;
