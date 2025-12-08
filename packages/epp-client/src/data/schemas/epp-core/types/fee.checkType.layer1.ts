/**
 * Layer-1 XML JSON schema for type fee:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeCommandTypeXml } from './fee.commandType.layer1.js';

export const FeeCheckTypeXml = zloosen(
  z.object({
    'fee:currency': z
      .union([
        z.string().regex(/[A-Z]{3}/),
        zloosen(z.object({ '#text': z.string().regex(/[A-Z]{3}/) })),
      ])
      .optional(),
    'fee:command': z.array(FeeCommandTypeXml).min(1),
  }),
);

export type FeeCheckTypeXml = z.infer<typeof FeeCheckTypeXml>;
