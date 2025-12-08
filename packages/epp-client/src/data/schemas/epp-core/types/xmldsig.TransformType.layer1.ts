/**
 * Layer-1 XML JSON schema for type xmldsig:TransformType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigTransformTypeXml = zloosen(
  z.object({
    '@_Algorithm': z.string(),
    '#text': z.string().optional(),
    'xmldsig:XPath': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type XmldsigTransformTypeXml = z.infer<typeof XmldsigTransformTypeXml>;
