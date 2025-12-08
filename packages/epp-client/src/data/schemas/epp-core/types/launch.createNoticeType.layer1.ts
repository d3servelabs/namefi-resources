/**
 * Layer-1 XML JSON schema for type launch:createNoticeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { LaunchNoticeIDTypeXml } from './launch.noticeIDType.layer1.js';

export const LaunchCreateNoticeTypeXml = z.object({
  'launch:noticeID': LaunchNoticeIDTypeXml,
  'launch:notAfter': z.string(),
  'launch:acceptedDate': z.string(),
});

export type LaunchCreateNoticeTypeXml = z.infer<
  typeof LaunchCreateNoticeTypeXml
>;
