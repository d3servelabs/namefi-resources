/**
 * Layer-1 XML JSON schema for type xmldsig:TransformsType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigTransformXml } from '../elements/xmldsig.Transform.layer1.js';

export const XmldsigTransformsTypeXml = zloosen(
  z.object({
    'xmldsig:Transform': z.array(XmldsigTransformXml).min(1),
  }),
);

export type XmldsigTransformsTypeXml = z.infer<typeof XmldsigTransformsTypeXml>;
