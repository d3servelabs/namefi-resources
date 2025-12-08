/**
 * Layer-1 XML JSON schema for type launch:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1.js';
import { LaunchStatusTypeXml } from './launch.statusType.layer1.js';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1.js';

export const LaunchInfDataTypeXml = zloosen(
  z.object({
    'launch:phase': LaunchPhaseTypeXml,
    'launch:applicationID': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'launch:status': LaunchStatusTypeXml.optional(),
    'mark:abstractMark': z.array(MarkAbstractMarkXml).optional(),
  }),
);

export type LaunchInfDataTypeXml = z.infer<typeof LaunchInfDataTypeXml>;
