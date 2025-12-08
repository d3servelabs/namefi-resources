/**
 * Layer-1 XML JSON schema for type mark:e164Type.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const MarkE164TypeXml = z.object({
  '@_x': z.string().optional(),
  '#text': z.string().regex(/(\+[0-9]{1,3}\.[0-9]{1,14})?/),
});

export type MarkE164TypeXml = z.infer<typeof MarkE164TypeXml>;
