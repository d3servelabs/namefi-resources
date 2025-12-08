/**
 * Layer-1 XML JSON schema for type launch:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1';
import { LaunchCreateNoticeTypeXml } from './launch.createNoticeType.layer1';
import { LaunchCodeMarkTypeXml } from './launch.codeMarkType.layer1';
import { SignedMarkAbstractSignedMarkXml } from '../elements/signedMark.abstractSignedMark.layer1';
import { SignedMarkEncodedSignedMarkXml } from '../elements/signedMark.encodedSignedMark.layer1';

const _base0 = z.object({
  'launch:phase': LaunchPhaseTypeXml,
  'launch:notice': LaunchCreateNoticeTypeXml.optional(),
});

const _base1 = z.object({
  '@_type': z.enum(['application', 'registration']).optional(),
});

export const LaunchCreateTypeXml = z.union([
  zloosen(
    z.object({
      ..._base1.shape,
      'launch:phase': LaunchPhaseTypeXml,
      'launch:notice': LaunchCreateNoticeTypeXml.optional(),
      'launch:codeMark': z.array(LaunchCodeMarkTypeXml).min(1),
    }),
  ),
  zloosen(
    z.object({
      ..._base1.shape,
      'launch:phase': LaunchPhaseTypeXml,
      'launch:notice': LaunchCreateNoticeTypeXml.optional(),
      'signedMark:abstractSignedMark': z
        .array(SignedMarkAbstractSignedMarkXml)
        .min(1),
    }),
  ),
  zloosen(
    z.object({
      ..._base1.shape,
      'launch:phase': LaunchPhaseTypeXml,
      'launch:notice': LaunchCreateNoticeTypeXml.optional(),
      'signedMark:encodedSignedMark': z
        .array(SignedMarkEncodedSignedMarkXml)
        .min(1),
    }),
  ),
]);

export type LaunchCreateTypeXml = z.infer<typeof LaunchCreateTypeXml>;
