/**
 * Layer-1 XML JSON schema for type epp:responseType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppResultTypeXml } from './epp.resultType.layer1';
import { EppMsgQTypeXml } from './epp.msgQType.layer1';
import { EppResDataTypeXml } from './epp.resDataType.layer1';
import { EppExtDataTypeXml } from './epp.extDataType.layer1';
import { EppTrIDTypeXml } from './epp.trIDType.layer1';

export const EppResponseTypeXml = zloosen(
  z.object({
    'epp:result': z.array(EppResultTypeXml).min(1),
    'epp:msgQ': EppMsgQTypeXml.optional(),
    'epp:resData': EppResDataTypeXml.optional(),
    'epp:extension': EppExtDataTypeXml.optional(),
    'epp:trID': EppTrIDTypeXml,
  }),
);

export type EppResponseTypeXml = z.infer<typeof EppResponseTypeXml>;
