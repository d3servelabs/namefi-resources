/**
 * Layer-1 XML JSON schema for type xmldsig:SignatureType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigSignedInfoXml } from '../elements/xmldsig.SignedInfo.layer1.js';
import { XmldsigSignatureValueXml } from '../elements/xmldsig.SignatureValue.layer1.js';
import { XmldsigKeyInfoXml } from '../elements/xmldsig.KeyInfo.layer1.js';
import { XmldsigObjectXml } from '../elements/xmldsig.Object.layer1.js';

export const XmldsigSignatureTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    'xmldsig:SignedInfo': XmldsigSignedInfoXml,
    'xmldsig:SignatureValue': XmldsigSignatureValueXml,
    'xmldsig:KeyInfo': XmldsigKeyInfoXml.optional(),
    'xmldsig:Object': z.array(XmldsigObjectXml).optional(),
  }),
);

export type XmldsigSignatureTypeXml = z.infer<typeof XmldsigSignatureTypeXml>;
