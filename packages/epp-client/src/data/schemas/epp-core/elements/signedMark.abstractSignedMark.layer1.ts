/**
 * Layer-1 XML JSON schema for <signedMark:abstractSignedMark>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { SignedMarkAbstractSignedMarkTypeXml } from '../types/signedMark.abstractSignedMarkType.layer1.js';

export const SignedMarkAbstractSignedMarkXml =
  SignedMarkAbstractSignedMarkTypeXml;

export type SignedMarkAbstractSignedMarkXml = z.infer<
  typeof SignedMarkAbstractSignedMarkXml
>;
