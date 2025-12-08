/**
 * Layer-1 XML JSON schema for type fee:transformCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeFeeTypeXml } from './fee.feeType.layer1.js';
import { FeeCreditTypeXml } from './fee.creditType.layer1.js';

export const FeeTransformCommandTypeXml = zloosen(
  z.object({
    'fee:currency': z
      .union([
        z.string().regex(/[A-Z]{3}/),
        zloosen(z.object({ '#text': z.string().regex(/[A-Z]{3}/) })),
      ])
      .optional(),
    'fee:fee': z.array(FeeFeeTypeXml).min(1),
    'fee:credit': z.array(FeeCreditTypeXml).optional(),
  }),
);

export type FeeTransformCommandTypeXml = z.infer<
  typeof FeeTransformCommandTypeXml
>;
