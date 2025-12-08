/**
 * Layer-1 XML JSON schema for type secDNS:dsDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1.js';

export const SecDNSDsDataTypeXml = z.object({
  'secDNS:keyTag': z.string().regex(/^-?\d+$/),
  'secDNS:alg': z.string().regex(/^-?\d+$/),
  'secDNS:digestType': z.string().regex(/^-?\d+$/),
  'secDNS:digest': z.string(),
  'secDNS:keyData': SecDNSKeyDataTypeXml.optional(),
});

export type SecDNSDsDataTypeXml = z.infer<typeof SecDNSDsDataTypeXml>;
