/**
 * Layer-1 XML JSON schema for type fee:transformCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeFeeTypeXml } from './fee.feeType.layer1';
import { FeeCreditTypeXml } from './fee.creditType.layer1';

export const FeeTransformCommandTypeXml = zloosen(
  z.object({
    'fee:currency': zloosen(
      z.object({ '#text': z.string().regex(/[A-Z]{3}/) }),
    ).optional(),
    'fee:fee': z.array(FeeFeeTypeXml).min(1),
    'fee:credit': z.array(FeeCreditTypeXml).optional(),
  }),
);

export type FeeTransformCommandTypeXml = z.infer<
  typeof FeeTransformCommandTypeXml
>;
