/**
 * Layer-1 XML JSON schema for type signedMark:issuerInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { MarkE164TypeXml } from './mark.e164Type.layer1.js';

export const SignedMarkIssuerInfoTypeXml = z.object({
  '@_issuerID': z.string(),
  'signedMark:org': z.string(),
  'signedMark:email': z.string().min(1),
  'signedMark:url': z.string().optional(),
  'signedMark:voice': MarkE164TypeXml.optional(),
});

export type SignedMarkIssuerInfoTypeXml = z.infer<
  typeof SignedMarkIssuerInfoTypeXml
>;
