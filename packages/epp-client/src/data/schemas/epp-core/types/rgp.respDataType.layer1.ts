/**
 * Layer-1 XML JSON schema for type rgp:respDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { RgpStatusTypeXml } from './rgp.statusType.layer1.js';

export const RgpRespDataTypeXml = z.object({
  'rgp:rgpStatus': z.array(RgpStatusTypeXml).min(1),
});

export type RgpRespDataTypeXml = z.infer<typeof RgpRespDataTypeXml>;
