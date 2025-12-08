/**
 * Layer-1 XML JSON schema for type launch:claimKeyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const LaunchClaimKeyTypeXml = zloosen(
  z.object({
    '@_validatorID': z.string().min(1).optional(),
    '#text': z.string(),
  }),
);

export type LaunchClaimKeyTypeXml = z.infer<typeof LaunchClaimKeyTypeXml>;
