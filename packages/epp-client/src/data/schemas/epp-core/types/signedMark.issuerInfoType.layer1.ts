/**
 * Layer-1 XML JSON schema for type signedMark:issuerInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkE164TypeXml } from './mark.e164Type.layer1';

export const SignedMarkIssuerInfoTypeXml = zloosen(
  z.object({
    '@_issuerID': z.string(),
    'signedMark:org': zloosen(z.object({ '#text': z.string() })),
    'signedMark:email': zloosen(z.object({ '#text': z.string().min(1) })),
    'signedMark:url': zloosen(z.object({ '#text': z.string() })).optional(),
    'signedMark:voice': MarkE164TypeXml.optional(),
  }),
);

export type SignedMarkIssuerInfoTypeXml = z.infer<
  typeof SignedMarkIssuerInfoTypeXml
>;
