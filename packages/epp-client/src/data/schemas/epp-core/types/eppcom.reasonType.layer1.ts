/**
 * Layer-1 XML JSON schema for type eppcom:reasonType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppcomReasonTypeXml = zloosen(
  z.object({
    '@_lang': z.string().optional(),
    '#text': z.string().min(1).max(32),
  }),
);

export type EppcomReasonTypeXml = z.infer<typeof EppcomReasonTypeXml>;
