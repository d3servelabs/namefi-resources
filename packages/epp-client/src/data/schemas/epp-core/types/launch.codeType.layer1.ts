/**
 * Layer-1 XML JSON schema for type launch:codeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const LaunchCodeTypeXml = z.object({
  '@_validatorID': z.string().min(1).optional(),
  '#text': z.string().min(1),
});

export type LaunchCodeTypeXml = z.infer<typeof LaunchCodeTypeXml>;
