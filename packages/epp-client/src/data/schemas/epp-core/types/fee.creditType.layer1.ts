/**
 * Layer-1 XML JSON schema for type fee:creditType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const FeeCreditTypeXml = zloosen(
  z.object({
    '@_description': z.string().optional(),
    '@_lang': z.string().default('en').optional(),
    '#text': z.string().regex(/^-?\d+(\.\d+)?$/),
  }),
);

export type FeeCreditTypeXml = z.infer<typeof FeeCreditTypeXml>;
