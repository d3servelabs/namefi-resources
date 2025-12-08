/**
 * Layer-1 XML JSON schema for type launch:codeMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchCodeTypeXml } from './launch.codeType.layer1';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1';

export const LaunchCodeMarkTypeXml = zloosen(
  z.object({
    'launch:code': LaunchCodeTypeXml.optional(),
    'mark:abstractMark': MarkAbstractMarkXml.optional(),
  }),
);

export type LaunchCodeMarkTypeXml = z.infer<typeof LaunchCodeMarkTypeXml>;
