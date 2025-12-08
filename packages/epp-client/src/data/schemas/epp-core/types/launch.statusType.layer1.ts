/**
 * Layer-1 XML JSON schema for type launch:statusType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const LaunchStatusTypeXml = z.object({
  '@_s': z.enum([
    'pendingValidation',
    'validated',
    'invalid',
    'pendingAllocation',
    'allocated',
    'rejected',
    'custom',
  ]),
  '@_lang': z.string().default('en').optional(),
  '@_name': z.string().optional(),
  '#text': z.string(),
});

export type LaunchStatusTypeXml = z.infer<typeof LaunchStatusTypeXml>;
