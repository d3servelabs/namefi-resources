/**
 * Layer-1 XML JSON schema for type epp:msgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppMsgTypeXml = zloosen(
  z.object({
    '@_lang': z.string().default('en').optional(),
    '#text': z.string(),
  }),
);

export type EppMsgTypeXml = z.infer<typeof EppMsgTypeXml>;
