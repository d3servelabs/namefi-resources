/**
 * Layer-1 XML JSON schema for type signedMark:encodedSignedMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const SignedMarkEncodedSignedMarkTypeXml = zloosen(
  z.object({
    '@_encoding': z.string().default('base64').optional(),
    '#text': z.string(),
  }),
);

export type SignedMarkEncodedSignedMarkTypeXml = z.infer<
  typeof SignedMarkEncodedSignedMarkTypeXml
>;
