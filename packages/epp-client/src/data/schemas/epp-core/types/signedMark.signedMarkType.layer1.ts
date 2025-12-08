/**
 * Layer-1 XML JSON schema for type signedMark:signedMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SignedMarkIssuerInfoTypeXml } from './signedMark.issuerInfoType.layer1';
import { MarkAbstractMarkXml } from '../elements/mark.abstractMark.layer1';
import { XmldsigSignatureXml } from '../elements/xmldsig.Signature.layer1';

export const SignedMarkSignedMarkTypeXml = zloosen(
  z.object({
    '@_id': z.string(),
    'signedMark:id': zloosen(
      z.object({ '#text': z.string().regex(/\d+-\d+/) }),
    ),
    'signedMark:issuerInfo': SignedMarkIssuerInfoTypeXml,
    'signedMark:notBefore': zloosen(z.object({ '#text': z.string() })),
    'signedMark:notAfter': zloosen(z.object({ '#text': z.string() })),
    'mark:abstractMark': MarkAbstractMarkXml,
    'xmldsig:Signature': XmldsigSignatureXml,
  }),
);

export type SignedMarkSignedMarkTypeXml = z.infer<
  typeof SignedMarkSignedMarkTypeXml
>;
