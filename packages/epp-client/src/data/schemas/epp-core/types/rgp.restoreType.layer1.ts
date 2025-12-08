/**
 * Layer-1 XML JSON schema for type rgp:restoreType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { RgpReportTypeXml } from './rgp.reportType.layer1.js';

export const RgpRestoreTypeXml = z.object({
  '@_op': z.enum(['request', 'report']),
  'rgp:report': RgpReportTypeXml.optional(),
});

export type RgpRestoreTypeXml = z.infer<typeof RgpRestoreTypeXml>;
