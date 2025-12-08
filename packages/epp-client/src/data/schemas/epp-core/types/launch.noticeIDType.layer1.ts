/**
 * Layer-1 XML JSON schema for type launch:noticeIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const LaunchNoticeIDTypeXml = z.object({
  '@_validatorID': z.string().min(1).optional(),
  '#text': z.string().min(1),
});

export type LaunchNoticeIDTypeXml = z.infer<typeof LaunchNoticeIDTypeXml>;
