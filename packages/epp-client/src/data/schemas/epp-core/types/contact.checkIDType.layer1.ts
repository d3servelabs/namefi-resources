/**
 * Layer-1 XML JSON schema for type contact:checkIDType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ContactCheckIDTypeXml = zloosen(
  z.object({
    '@_avail': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
    '#text': z.string().min(3).max(64),
  }),
);

export type ContactCheckIDTypeXml = z.infer<typeof ContactCheckIDTypeXml>;
