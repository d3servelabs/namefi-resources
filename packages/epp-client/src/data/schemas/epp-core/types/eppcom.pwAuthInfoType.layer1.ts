/**
 * Layer-1 XML JSON schema for type eppcom:pwAuthInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppcomPwAuthInfoTypeXml = z.object({
  '@_roid': z
    .string()
    .regex(/(\w|_){1,80}-\w{1,8}/)
    .optional(),
  '#text': z.string(),
});

export type EppcomPwAuthInfoTypeXml = z.infer<typeof EppcomPwAuthInfoTypeXml>;
