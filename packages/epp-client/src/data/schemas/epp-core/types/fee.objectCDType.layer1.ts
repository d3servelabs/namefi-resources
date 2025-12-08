/**
 * Layer-1 XML JSON schema for type fee:objectCDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeObjectIdentifierTypeXml } from './fee.objectIdentifierType.layer1';
import { FeeCommandDataTypeXml } from './fee.commandDataType.layer1';
import { FeeReasonTypeXml } from './fee.reasonType.layer1';

export const FeeObjectCDTypeXml = zloosen(
  z.object({
    '@_avail': z
      .union([
        z.literal('true'),
        z.literal('false'),
        z.literal('1'),
        z.literal('0'),
      ])
      .default('1')
      .optional(),
    'fee:objID': FeeObjectIdentifierTypeXml,
    'fee:class': zloosen(z.object({ '#text': z.string() })).optional(),
    'fee:command': z.array(FeeCommandDataTypeXml).optional(),
    'fee:reason': FeeReasonTypeXml.optional(),
  }),
);

export type FeeObjectCDTypeXml = z.infer<typeof FeeObjectCDTypeXml>;
