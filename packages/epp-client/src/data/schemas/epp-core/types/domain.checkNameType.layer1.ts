/**
 * Layer-1 XML JSON schema for type domain:checkNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const DomainCheckNameTypeXml = zloosen(
  z.object({
    '@_avail': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
    '#text': z.string().min(1).max(255),
  }),
);

export type DomainCheckNameTypeXml = z.infer<typeof DomainCheckNameTypeXml>;
