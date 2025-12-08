/**
 * Layer-1 XML JSON schema for type launch:cdNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const LaunchCdNameTypeXml = zloosen(
  z.object({
    '@_exists': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
    '#text': z.string().min(1).max(255),
  }),
);

export type LaunchCdNameTypeXml = z.infer<typeof LaunchCdNameTypeXml>;
