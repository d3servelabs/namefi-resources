/**
 * Layer-1 XML JSON schema for <xmldsig:Manifest>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigManifestTypeXml } from '../types/xmldsig.ManifestType.layer1.js';

export const XmldsigManifestXml = XmldsigManifestTypeXml;

export type XmldsigManifestXml = z.infer<typeof XmldsigManifestXml>;
