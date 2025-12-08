/**
 * Layer-1 XML JSON schema for type fee:transformResultType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';
import { FeeFeeTypeXml } from './fee.feeType.layer1.js';
import { FeeCreditTypeXml } from './fee.creditType.layer1.js';

export const FeeTransformResultTypeXml = zloosen(
  z.object({
    'fee:currency': z
      .union([
        z.string().regex(/[A-Z]{3}/),
        zloosen(z.object({ '#text': z.string().regex(/[A-Z]{3}/) })),
      ])
      .optional(),
    'fee:period': DomainPeriodTypeXml.optional(),
    'fee:fee': z.array(FeeFeeTypeXml).optional(),
    'fee:credit': z.array(FeeCreditTypeXml).optional(),
    'fee:balance': z
      .union([
        z.string().regex(/^-?\d+(\.\d+)?$/),
        zloosen(z.object({ '#text': z.string().regex(/^-?\d+(\.\d+)?$/) })),
      ])
      .optional(),
    'fee:creditLimit': z
      .union([
        z.string().regex(/^-?\d+(\.\d+)?$/),
        zloosen(z.object({ '#text': z.string().regex(/^-?\d+(\.\d+)?$/) })),
      ])
      .optional(),
  }),
);

export type FeeTransformResultTypeXml = z.infer<
  typeof FeeTransformResultTypeXml
>;
