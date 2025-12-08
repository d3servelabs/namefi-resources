/**
 * Layer-1 XML JSON schema for type rgp:reportType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { RgpMixedTypeXml } from './rgp.mixedType.layer1';
import { RgpReportTextTypeXml } from './rgp.reportTextType.layer1';

export const RgpReportTypeXml = zloosen(
  z.object({
    'rgp:preData': RgpMixedTypeXml,
    'rgp:postData': RgpMixedTypeXml,
    'rgp:delTime': zloosen(z.object({ '#text': z.string() })),
    'rgp:resTime': zloosen(z.object({ '#text': z.string() })),
    'rgp:resReason': RgpReportTextTypeXml,
    'rgp:statement': z.array(RgpReportTextTypeXml).min(1),
    'rgp:other': RgpMixedTypeXml.optional(),
  }),
);

export type RgpReportTypeXml = z.infer<typeof RgpReportTypeXml>;
