/**
 * Layer-1 XML JSON schema for type fee:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeCommandTypeXml } from './fee.commandType.layer1';

export const FeeCheckTypeXml = zloosen(
  z.object({
    'fee:currency': zloosen(
      z.object({ '#text': z.string().regex(/[A-Z]{3}/) }),
    ).optional(),
    'fee:command': z.array(FeeCommandTypeXml).min(1),
  }),
);

export type FeeCheckTypeXml = z.infer<typeof FeeCheckTypeXml>;
