/**
 * Layer-1 XML JSON schema for type host:paNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const HostPaNameTypeXml = zloosen(
  z.object({
    '@_paResult': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
    '#text': z.string().min(1).max(255),
  }),
);

export type HostPaNameTypeXml = z.infer<typeof HostPaNameTypeXml>;
