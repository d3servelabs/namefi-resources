/**
 * Layer-1 XML JSON schema for type xmldsig:ManifestType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { XmldsigReferenceXml } from '../elements/xmldsig.Reference.layer1.js';

export const XmldsigManifestTypeXml = z.object({
  '@_Id': z.string().optional(),
  'xmldsig:Reference': z.array(XmldsigReferenceXml).min(1),
});

export type XmldsigManifestTypeXml = z.infer<typeof XmldsigManifestTypeXml>;
