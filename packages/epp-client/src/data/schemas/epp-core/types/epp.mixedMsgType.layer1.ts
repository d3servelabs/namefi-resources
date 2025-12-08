/**
 * Layer-1 XML JSON schema for type epp:mixedMsgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppMixedMsgTypeXml = z.object({
  '@_lang': z.string().default('en').optional(),
  '#text': z.string().optional(),
});

export type EppMixedMsgTypeXml = z.infer<typeof EppMixedMsgTypeXml>;
