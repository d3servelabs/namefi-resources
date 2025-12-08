/**
 * Layer-1 XML JSON schema for type mark:protectionType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const MarkProtectionTypeXml = z.object({
  'mark:cc': z.string(),
  'mark:region': z.string().optional(),
  'mark:ruling': z.array(z.string()).optional(),
});

export type MarkProtectionTypeXml = z.infer<typeof MarkProtectionTypeXml>;
