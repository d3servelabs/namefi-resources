/**
 * Layer-1 XML JSON schema for type eppcom:pwAuthInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppcomPwAuthInfoTypeXml = zloosen(
  z.object({
    '@_roid': z
      .string()
      .regex(/(\w|_){1,80}-\w{1,8}/)
      .optional(),
    '#text': z.string(),
  }),
);

export type EppcomPwAuthInfoTypeXml = z.infer<typeof EppcomPwAuthInfoTypeXml>;
