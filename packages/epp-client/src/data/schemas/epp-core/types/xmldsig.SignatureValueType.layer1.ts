/**
 * Layer-1 XML JSON schema for type xmldsig:SignatureValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigSignatureValueTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    '#text': z.string(),
  }),
);

export type XmldsigSignatureValueTypeXml = z.infer<
  typeof XmldsigSignatureValueTypeXml
>;
