/**
 * Layer-1 XML JSON schema for type signedMark:encodedSignedMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const SignedMarkEncodedSignedMarkTypeXml = z.object({
  '@_encoding': z.string().default('base64').optional(),
  '#text': z.string(),
});

export type SignedMarkEncodedSignedMarkTypeXml = z.infer<
  typeof SignedMarkEncodedSignedMarkTypeXml
>;
