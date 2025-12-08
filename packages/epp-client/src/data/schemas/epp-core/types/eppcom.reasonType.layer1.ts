/**
 * Layer-1 XML JSON schema for type eppcom:reasonType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppcomReasonTypeXml = z.object({
  '@_lang': z.string().optional(),
  '#text': z.string().min(1).max(32),
});

export type EppcomReasonTypeXml = z.infer<typeof EppcomReasonTypeXml>;
