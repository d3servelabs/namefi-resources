/**
 * Layer-1 XML JSON schema for type rgp:reportType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { RgpMixedTypeXml } from './rgp.mixedType.layer1.js';
import { RgpReportTextTypeXml } from './rgp.reportTextType.layer1.js';

export const RgpReportTypeXml = z.object({
  'rgp:preData': RgpMixedTypeXml,
  'rgp:postData': RgpMixedTypeXml,
  'rgp:delTime': z.string(),
  'rgp:resTime': z.string(),
  'rgp:resReason': RgpReportTextTypeXml,
  'rgp:statement': z.array(RgpReportTextTypeXml).min(1),
  'rgp:other': RgpMixedTypeXml.optional(),
});

export type RgpReportTypeXml = z.infer<typeof RgpReportTypeXml>;
