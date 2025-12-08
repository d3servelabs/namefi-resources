/**
 * Layer-1 XML JSON schema for type signedMark:signedMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { SignedMarkIssuerInfoTypeXml } from './signedMark.issuerInfoType.layer1.js';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1.js';
import { XmldsigSignatureXml } from '../elements/xmldsig.Signature.layer1.js';

export const SignedMarkSignedMarkTypeXml = z.object({
  '@_id': z.string(),
  'signedMark:id': z.string().regex(/\d+-\d+/),
  'signedMark:issuerInfo': SignedMarkIssuerInfoTypeXml,
  'signedMark:notBefore': z.string(),
  'signedMark:notAfter': z.string(),
  'mark:abstractMark': MarkAbstractMarkXml,
  'xmldsig:Signature': XmldsigSignatureXml,
});

export type SignedMarkSignedMarkTypeXml = z.infer<
  typeof SignedMarkSignedMarkTypeXml
>;
