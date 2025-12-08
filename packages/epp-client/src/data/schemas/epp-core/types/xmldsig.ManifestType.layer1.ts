/**
 * Layer-1 XML JSON schema for type xmldsig:ManifestType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigReferenceXml } from '../elements/xmldsig.Reference.layer1';

export const XmldsigManifestTypeXml = zloosen(
  z.object({
    '@_Id': z.string().optional(),
    'xmldsig:Reference': z.array(XmldsigReferenceXml).min(1),
  }),
);

export type XmldsigManifestTypeXml = z.infer<typeof XmldsigManifestTypeXml>;
