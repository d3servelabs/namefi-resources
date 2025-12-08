/**
 * Layer-1 XML JSON schema for type mark:markType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkTrademarkTypeXml } from './mark.trademarkType.layer1';
import { MarkTreatyOrStatuteTypeXml } from './mark.treatyOrStatuteType.layer1';
import { MarkCourtTypeXml } from './mark.courtType.layer1';

export const MarkMarkTypeXml = zloosen(
  z.object({
    'mark:trademark': z.array(MarkTrademarkTypeXml).optional(),
    'mark:treatyOrStatute': z.array(MarkTreatyOrStatuteTypeXml).optional(),
    'mark:court': z.array(MarkCourtTypeXml).optional(),
  }),
);

export type MarkMarkTypeXml = z.infer<typeof MarkMarkTypeXml>;
