/**
 * Layer-1 XML JSON schema for type domain:contactType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainContactTypeXml = zloosen(
  z.object({
    '@_type': z.enum(['admin', 'billing', 'tech']).optional(),
    '#text': z.string().min(3).max(64),
  }),
);

export type DomainContactTypeXml = z.infer<typeof DomainContactTypeXml>;
