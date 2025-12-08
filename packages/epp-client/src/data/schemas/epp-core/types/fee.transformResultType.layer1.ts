/**
 * Layer-1 XML JSON schema for type fee:transformResultType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';
import { FeeFeeTypeXml } from './fee.feeType.layer1.js';
import { FeeCreditTypeXml } from './fee.creditType.layer1.js';

export const FeeTransformResultTypeXml = z.object({
  'fee:currency': z
    .string()
    .regex(/[A-Z]{3}/)
    .optional(),
  'fee:period': DomainPeriodTypeXml.optional(),
  'fee:fee': z.array(FeeFeeTypeXml).optional(),
  'fee:credit': z.array(FeeCreditTypeXml).optional(),
  'fee:balance': z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .optional(),
  'fee:creditLimit': z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .optional(),
});

export type FeeTransformResultTypeXml = z.infer<
  typeof FeeTransformResultTypeXml
>;
