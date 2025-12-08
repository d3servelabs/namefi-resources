/**
 * Layer-1 XML JSON schema for type xmldsig:SignaturePropertiesType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigSignaturePropertyXml } from '../elements/xmldsig.SignatureProperty.layer1.js';

export const XmldsigSignaturePropertiesTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    'xmldsig:SignatureProperty': z.array(XmldsigSignaturePropertyXml).min(1),
  }),
);

export type XmldsigSignaturePropertiesTypeXml = z.infer<
  typeof XmldsigSignaturePropertiesTypeXml
>;
