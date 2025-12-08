/**
 * Layer-1 XML JSON schema for type launch:idContainerType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1';

export const LaunchIdContainerTypeXml = zloosen(
  z.object({
    'launch:phase': LaunchPhaseTypeXml,
    'launch:applicationID': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type LaunchIdContainerTypeXml = z.infer<typeof LaunchIdContainerTypeXml>;
