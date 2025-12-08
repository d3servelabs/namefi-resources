/**
 * Layer-1 XML JSON schema for type launch:createNoticeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchNoticeIDTypeXml } from './launch.noticeIDType.layer1.js';

export const LaunchCreateNoticeTypeXml = zloosen(
  z.object({
    'launch:noticeID': LaunchNoticeIDTypeXml,
    'launch:notAfter': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'launch:acceptedDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type LaunchCreateNoticeTypeXml = z.infer<
  typeof LaunchCreateNoticeTypeXml
>;
