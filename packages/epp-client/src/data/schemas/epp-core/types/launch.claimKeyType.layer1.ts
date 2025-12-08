/**
 * Layer-1 XML JSON schema for type launch:claimKeyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const LaunchClaimKeyTypeXml = z.object({
  '@_validatorID': z.string().min(1).optional(),
  '#text': z.string(),
});

export type LaunchClaimKeyTypeXml = z.infer<typeof LaunchClaimKeyTypeXml>;
