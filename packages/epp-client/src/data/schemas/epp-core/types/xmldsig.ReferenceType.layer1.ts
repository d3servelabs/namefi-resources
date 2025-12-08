/**
 * Layer-1 XML JSON schema for type xmldsig:ReferenceType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigTransformsXml } from '../elements/xmldsig.Transforms.layer1.js';
import { XmldsigDigestMethodXml } from '../elements/xmldsig.DigestMethod.layer1.js';
import { XmldsigDigestValueXml } from '../elements/xmldsig.DigestValue.layer1.js';

export const XmldsigReferenceTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    '@_URI': z.string().optional(),
    '@_Type': z.string().optional(),
    'xmldsig:Transforms': XmldsigTransformsXml.optional(),
    'xmldsig:DigestMethod': XmldsigDigestMethodXml,
    'xmldsig:DigestValue': XmldsigDigestValueXml,
  }),
);

export type XmldsigReferenceTypeXml = z.infer<typeof XmldsigReferenceTypeXml>;
