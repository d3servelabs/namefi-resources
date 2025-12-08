/**
 * Layer-1 XML JSON schema for type fee:feeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const FeeFeeTypeXml = zloosen(
  z.object({
    '@_description': z.string().optional(),
    '@_lang': z.string().default('en').optional(),
    '@_refundable': z
      .union([
        z.literal('true'),
        z.literal('false'),
        z.literal('1'),
        z.literal('0'),
      ])
      .optional(),
    '@_grace-period': z.string().optional(),
    '@_applied': z.enum(['immediate', 'delayed']).optional(),
    '#text': z.string().regex(/^-?\d+(\.\d+)?$/),
  }),
);

export type FeeFeeTypeXml = z.infer<typeof FeeFeeTypeXml>;
