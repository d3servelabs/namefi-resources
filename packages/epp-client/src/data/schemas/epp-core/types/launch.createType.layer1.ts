/**
 * Layer-1 XML JSON schema for type launch:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { LaunchPhaseTypeXml } from './launch.phaseType.layer1.js';
import { LaunchCreateNoticeTypeXml } from './launch.createNoticeType.layer1.js';
import { LaunchCodeMarkTypeXml } from './launch.codeMarkType.layer1.js';
import { SignedMarkAbstractSignedMarkXml } from '../elements/signedMark.abstractSignedMark.layer1.js';
import { SignedMarkEncodedSignedMarkXml } from '../elements/signedMark.encodedSignedMark.layer1.js';

const _base0 = z.object({
  'launch:phase': LaunchPhaseTypeXml,
  'launch:notice': LaunchCreateNoticeTypeXml.optional(),
});

export const LaunchCreateTypeXml = z
  .object({
    '@_type': z.enum(['application', 'registration']).optional(),
  })
  .and(
    z.union([
      z.object({
        ..._base0.shape,
        'launch:codeMark': z.array(LaunchCodeMarkTypeXml).min(1),
      }),
      z.object({
        ..._base0.shape,
        'signedMark:abstractSignedMark': z
          .array(SignedMarkAbstractSignedMarkXml)
          .min(1),
      }),
      z.object({
        ..._base0.shape,
        'signedMark:encodedSignedMark': z
          .array(SignedMarkEncodedSignedMarkXml)
          .min(1),
      }),
    ]),
  );

export type LaunchCreateTypeXml = z.infer<typeof LaunchCreateTypeXml>;
