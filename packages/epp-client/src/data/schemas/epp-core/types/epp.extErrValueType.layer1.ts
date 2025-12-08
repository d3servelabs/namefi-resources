/**
 * Layer-1 XML JSON schema for type epp:extErrValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppErrValueTypeXml } from './epp.errValueType.layer1.js';
import { EppMsgTypeXml } from './epp.msgType.layer1.js';

export const EppExtErrValueTypeXml = z.object({
  'epp:value': EppErrValueTypeXml,
  'epp:reason': EppMsgTypeXml,
});

export type EppExtErrValueTypeXml = z.infer<typeof EppExtErrValueTypeXml>;
