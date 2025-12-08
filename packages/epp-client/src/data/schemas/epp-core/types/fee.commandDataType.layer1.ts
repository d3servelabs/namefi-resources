/**
 * Layer-1 XML JSON schema for type fee:commandDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeFeeTypeXml } from './fee.feeType.layer1';
import { FeeCreditTypeXml } from './fee.creditType.layer1';
import { FeeReasonTypeXml } from './fee.reasonType.layer1';

export const FeeCommandDataTypeXml = zloosen(
  z.object({
    '@_name': z.enum([
      'create',
      'delete',
      'renew',
      'update',
      'transfer',
      'restore',
      'custom',
    ]),
    '@_customName': z.string().optional(),
    '@_phase': z.string().optional(),
    '@_subphase': z.string().optional(),
    '@_standard': z
      .union([
        z.literal('true'),
        z.literal('false'),
        z.literal('1'),
        z.literal('0'),
      ])
      .default('0')
      .optional(),
    'fee:fee': z.array(FeeFeeTypeXml).optional(),
    'fee:credit': z.array(FeeCreditTypeXml).optional(),
    'fee:reason': FeeReasonTypeXml.optional(),
  }),
);

export type FeeCommandDataTypeXml = z.infer<typeof FeeCommandDataTypeXml>;
