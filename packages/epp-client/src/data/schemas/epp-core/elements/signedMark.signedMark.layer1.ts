/**
 * Layer-1 XML JSON schema for <signedMark:signedMark>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SignedMarkSignedMarkTypeXml } from '../types/signedMark.signedMarkType.layer1';

export const SignedMarkSignedMarkXml = SignedMarkSignedMarkTypeXml;

export type SignedMarkSignedMarkXml = z.infer<typeof SignedMarkSignedMarkXml>;
