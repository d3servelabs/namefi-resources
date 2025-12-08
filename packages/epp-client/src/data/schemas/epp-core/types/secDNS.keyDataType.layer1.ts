/**
 * Layer-1 XML JSON schema for type secDNS:keyDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const SecDNSKeyDataTypeXml = z.object({
  'secDNS:flags': z.string().regex(/^-?\d+$/),
  'secDNS:protocol': z.string().regex(/^-?\d+$/),
  'secDNS:alg': z.string().regex(/^-?\d+$/),
  'secDNS:pubKey': z.string().min(1),
});

export type SecDNSKeyDataTypeXml = z.infer<typeof SecDNSKeyDataTypeXml>;
