/**
 * Layer-1 XML JSON schema for type fee:creditType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const FeeCreditTypeXml = z.object({
  '@_description': z.string().optional(),
  '@_lang': z.string().default('en').optional(),
  '#text': z.string().regex(/^-?\d+(\.\d+)?$/),
});

export type FeeCreditTypeXml = z.infer<typeof FeeCreditTypeXml>;
