/**
 * Layer-1 XML JSON schema for type epp:mixedMsgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppMixedMsgTypeXml = zloosen(
  z.object({
    '@_lang': z.string().default('en').optional(),
    '#text': z.string().optional(),
  }),
);

export type EppMixedMsgTypeXml = z.infer<typeof EppMixedMsgTypeXml>;
