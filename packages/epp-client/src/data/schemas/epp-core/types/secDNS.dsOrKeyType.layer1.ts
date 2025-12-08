/**
 * Layer-1 XML JSON schema for type secDNS:dsOrKeyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { SecDNSDsDataTypeXml } from './secDNS.dsDataType.layer1.js';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1.js';

const _base0 = z.object({
  'secDNS:maxSigLife': z
    .string()
    .regex(/^-?\d+$/)
    .optional(),
});

export const SecDNSDsOrKeyTypeXml = z.union([
  z.object({
    ..._base0.shape,
    'secDNS:dsData': z.array(SecDNSDsDataTypeXml).min(1),
  }),
  z.object({
    ..._base0.shape,
    'secDNS:keyData': z.array(SecDNSKeyDataTypeXml).min(1),
  }),
]);

export type SecDNSDsOrKeyTypeXml = z.infer<typeof SecDNSDsOrKeyTypeXml>;
