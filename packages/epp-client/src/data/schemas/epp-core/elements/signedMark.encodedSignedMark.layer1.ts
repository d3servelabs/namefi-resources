/**
 * Layer-1 XML JSON schema for <signedMark:encodedSignedMark>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { SignedMarkEncodedSignedMarkTypeXml } from '../types/signedMark.encodedSignedMarkType.layer1.js';

export const SignedMarkEncodedSignedMarkXml =
  SignedMarkEncodedSignedMarkTypeXml;

export type SignedMarkEncodedSignedMarkXml = z.infer<
  typeof SignedMarkEncodedSignedMarkXml
>;
