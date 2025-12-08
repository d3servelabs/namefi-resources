/**
 * Layer-1 XML JSON schema for type xmldsig:SignedInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigCanonicalizationMethodXml } from '../elements/xmldsig.CanonicalizationMethod.layer1';
import { XmldsigSignatureMethodXml } from '../elements/xmldsig.SignatureMethod.layer1';
import { XmldsigReferenceXml } from '../elements/xmldsig.Reference.layer1';

export const XmldsigSignedInfoTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    'xmldsig:CanonicalizationMethod': XmldsigCanonicalizationMethodXml,
    'xmldsig:SignatureMethod': XmldsigSignatureMethodXml,
    'xmldsig:Reference': z.array(XmldsigReferenceXml).min(1),
  }),
);

export type XmldsigSignedInfoTypeXml = z.infer<typeof XmldsigSignedInfoTypeXml>;
