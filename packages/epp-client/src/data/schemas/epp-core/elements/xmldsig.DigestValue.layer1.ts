/**
 * Layer-1 XML JSON schema for <xmldsig:DigestValue>.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigDigestValueXml = z.string();

export type XmldsigDigestValueXml = z.infer<typeof XmldsigDigestValueXml>;
