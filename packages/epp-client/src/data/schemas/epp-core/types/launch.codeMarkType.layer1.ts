/**
 * Layer-1 XML JSON schema for type launch:codeMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchCodeTypeXml } from './launch.codeType.layer1.js';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1.js';

export const LaunchCodeMarkTypeXml = zloosen(
  z.object({
    'launch:code': LaunchCodeTypeXml.optional(),
    'mark:abstractMark': MarkAbstractMarkXml.optional(),
  }),
);

export type LaunchCodeMarkTypeXml = z.infer<typeof LaunchCodeMarkTypeXml>;
