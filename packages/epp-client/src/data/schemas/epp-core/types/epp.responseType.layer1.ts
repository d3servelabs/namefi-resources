/**
 * Layer-1 XML JSON schema for type epp:responseType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppResultTypeXml } from './epp.resultType.layer1.js';
import { EppMsgQTypeXml } from './epp.msgQType.layer1.js';
import { EppExtDataTypeXml } from './epp.extDataType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const EppResponseTypeXml = zloosen(
  z.object({
    'epp:result': z.array(EppResultTypeXml).min(1),
    'epp:msgQ': EppMsgQTypeXml.optional(),
    'epp:resData': EppExtDataTypeXml.optional(),
    'epp:extension': EppExtDataTypeXml.optional(),
    'epp:trID': EppTrIDTypeXml,
  }),
);

export type EppResponseTypeXml = z.infer<typeof EppResponseTypeXml>;
