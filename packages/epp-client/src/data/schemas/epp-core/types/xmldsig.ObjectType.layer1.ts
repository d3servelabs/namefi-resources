/**
 * Layer-1 XML JSON schema for type xmldsig:ObjectType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const XmldsigObjectTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    '@_MimeType': z.string().optional(),
    '@_Encoding': z.string().optional(),
    '#text': z.string().optional(),
  }),
);

export type XmldsigObjectTypeXml = z.infer<typeof XmldsigObjectTypeXml>;
