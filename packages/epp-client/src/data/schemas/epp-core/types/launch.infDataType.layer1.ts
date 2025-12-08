/**
 * Layer-1 XML JSON schema for type launch:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1';
import { LaunchStatusTypeXml } from './launch.statusType.layer1';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1';

export const LaunchInfDataTypeXml = zloosen(
  z.object({
    'launch:phase': LaunchPhaseTypeXml,
    'launch:applicationID': zloosen(
      z.object({ '#text': z.string() }),
    ).optional(),
    'launch:status': LaunchStatusTypeXml.optional(),
    'mark:abstractMark': z.array(MarkAbstractMarkXml).optional(),
  }),
);

export type LaunchInfDataTypeXml = z.infer<typeof LaunchInfDataTypeXml>;
