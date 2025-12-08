/**
 * Layer-1 XML JSON schema for type epp:msgQType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppMixedMsgTypeXml } from './epp.mixedMsgType.layer1.js';

export const EppMsgQTypeXml = z.object({
  '@_count': z.string().regex(/^-?\d+$/),
  '@_id': z.string().min(1),
  'epp:qDate': z.string().optional(),
  'epp:msg': EppMixedMsgTypeXml.optional(),
});

export type EppMsgQTypeXml = z.infer<typeof EppMsgQTypeXml>;
