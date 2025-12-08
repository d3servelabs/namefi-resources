/**
 * Layer-1 XML JSON schema for type launch:phaseType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const LaunchPhaseTypeXml = zloosen(
  z.object({
    '@_name': z.string().optional(),
    '#text': z.enum(['sunrise', 'landrush', 'claims', 'open', 'custom']),
  }),
);

export type LaunchPhaseTypeXml = z.infer<typeof LaunchPhaseTypeXml>;
