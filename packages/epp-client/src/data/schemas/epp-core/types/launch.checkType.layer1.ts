/**
 * Layer-1 XML JSON schema for type launch:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1.js';

export const LaunchCheckTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['claims', 'avail']).default('claims').optional(),
    'launch:phase': LaunchPhaseTypeXml,
  }),
);

export type LaunchCheckTypeXml = z.infer<typeof LaunchCheckTypeXml>;
