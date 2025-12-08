/**
 * Layer-1 XML JSON schema for type signedMark:issuerInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { MarkE164TypeXml } from './mark.e164Type.layer1.js';

export const SignedMarkIssuerInfoTypeXml = zloosen(
  z.object({
    '@_issuerID': z.string(),
    'signedMark:org': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'signedMark:email': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
    'signedMark:url': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'signedMark:voice': MarkE164TypeXml.optional(),
  }),
);

export type SignedMarkIssuerInfoTypeXml = z.infer<
  typeof SignedMarkIssuerInfoTypeXml
>;
