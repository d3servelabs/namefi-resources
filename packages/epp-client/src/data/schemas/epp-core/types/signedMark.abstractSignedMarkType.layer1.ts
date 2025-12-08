/**
 * Layer-1 XML JSON schema for type signedMark:abstractSignedMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const SignedMarkAbstractSignedMarkTypeXml = zloosen(z.object({}));

export type SignedMarkAbstractSignedMarkTypeXml = z.infer<
  typeof SignedMarkAbstractSignedMarkTypeXml
>;
