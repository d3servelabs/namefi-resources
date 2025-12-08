/**
 * Layer-1 XML JSON schema for type launch:infoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1';

export const LaunchInfoTypeXml = zloosen(
  z.object({
    '@_includeMark': z
      .union([
        z.literal('true'),
        z.literal('false'),
        z.literal('1'),
        z.literal('0'),
      ])
      .default('false')
      .optional(),
    'launch:phase': LaunchPhaseTypeXml,
    'launch:applicationID': zloosen(
      z.object({ '#text': z.string() }),
    ).optional(),
  }),
);

export type LaunchInfoTypeXml = z.infer<typeof LaunchInfoTypeXml>;
