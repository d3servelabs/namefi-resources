/**
 * Layer-1 XML JSON schema for type xmldsig:SignatureMethodType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigSignatureMethodTypeXml = zloosen(
  z.object({
    '@_Algorithm': z.string(),
    '#text': z.string().optional(),
    'xmldsig:HMACOutputLength': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ).optional(),
  }),
);

export type XmldsigSignatureMethodTypeXml = z.infer<
  typeof XmldsigSignatureMethodTypeXml
>;
