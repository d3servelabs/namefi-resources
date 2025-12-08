/**
 * Layer-1 XML JSON schema for <signedMark:encodedSignedMark>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SignedMarkEncodedSignedMarkTypeXml } from '../types/signedMark.encodedSignedMarkType.layer1';

export const SignedMarkEncodedSignedMarkXml =
  SignedMarkEncodedSignedMarkTypeXml;

export type SignedMarkEncodedSignedMarkXml = z.infer<
  typeof SignedMarkEncodedSignedMarkXml
>;
