/**
 * Layer-1 XML JSON schema for type launch:codeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const LaunchCodeTypeXml = zloosen(
  z.object({
    '@_validatorID': z.string().min(1).optional(),
    '#text': z.string().min(1),
  }),
);

export type LaunchCodeTypeXml = z.infer<typeof LaunchCodeTypeXml>;
