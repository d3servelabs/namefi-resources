/**
 * Layer-1 XML JSON schema for type fee:objectIdentifierType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const FeeObjectIdentifierTypeXml = zloosen(
  z.object({
    '@_element': z.string().default('name').optional(),
    '#text': z.string().min(1).max(255),
  }),
);

export type FeeObjectIdentifierTypeXml = z.infer<
  typeof FeeObjectIdentifierTypeXml
>;
