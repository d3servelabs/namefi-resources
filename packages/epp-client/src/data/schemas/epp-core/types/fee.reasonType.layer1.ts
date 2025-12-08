/**
 * Layer-1 XML JSON schema for type fee:reasonType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const FeeReasonTypeXml = zloosen(
  z.object({
    '@_lang': z.string().default('en').optional(),
    '#text': z.string(),
  }),
);

export type FeeReasonTypeXml = z.infer<typeof FeeReasonTypeXml>;
