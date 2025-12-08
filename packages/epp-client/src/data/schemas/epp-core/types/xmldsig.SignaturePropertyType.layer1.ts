/**
 * Layer-1 XML JSON schema for type xmldsig:SignaturePropertyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigSignaturePropertyTypeXml = zloosen(
  z.object({
    '@_Target': z.string(),
    '@_Id': z.string().optional(),
    '#text': z.string().optional(),
  }),
);

export type XmldsigSignaturePropertyTypeXml = z.infer<
  typeof XmldsigSignaturePropertyTypeXml
>;
