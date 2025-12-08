/**
 * Layer-1 XML JSON schema for type launch:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1.js';
import { LaunchCdTypeXml } from './launch.cdType.layer1.js';

export const LaunchChkDataTypeXml = zloosen(
  z.object({
    'launch:phase': LaunchPhaseTypeXml,
    'launch:cd': z.array(LaunchCdTypeXml).min(1),
  }),
);

export type LaunchChkDataTypeXml = z.infer<typeof LaunchChkDataTypeXml>;
