/**
 * Layer-1 XML JSON schema for type xmldsig:CanonicalizationMethodType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigCanonicalizationMethodTypeXml = zloosen(
  z.object({
    '@_Algorithm': z.string(),
    '#text': z.string().optional(),
  }),
);

export type XmldsigCanonicalizationMethodTypeXml = z.infer<
  typeof XmldsigCanonicalizationMethodTypeXml
>;
