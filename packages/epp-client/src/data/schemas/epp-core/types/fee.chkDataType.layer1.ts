/**
 * Layer-1 XML JSON schema for type fee:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeObjectCDTypeXml } from './fee.objectCDType.layer1.js';

export const FeeChkDataTypeXml = zloosen(
  z.object({
    'fee:currency': z.union([
      z.string().regex(/[A-Z]{3}/),
      zloosen(z.object({ '#text': z.string().regex(/[A-Z]{3}/) })),
    ]),
    'fee:cd': z.array(FeeObjectCDTypeXml).min(1),
  }),
);

export type FeeChkDataTypeXml = z.infer<typeof FeeChkDataTypeXml>;
