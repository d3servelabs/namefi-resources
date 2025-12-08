/**
 * Layer-1 XML JSON schema for type xmldsig:DigestMethodType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigDigestMethodTypeXml = zloosen(
  z.object({
    '@_Algorithm': z.string(),
    '#text': z.string().optional(),
  }),
);

export type XmldsigDigestMethodTypeXml = z.infer<
  typeof XmldsigDigestMethodTypeXml
>;
