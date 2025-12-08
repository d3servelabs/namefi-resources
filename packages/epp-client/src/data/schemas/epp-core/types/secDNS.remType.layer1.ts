/**
 * Layer-1 XML JSON schema for type secDNS:remType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { SecDNSDsDataTypeXml } from './secDNS.dsDataType.layer1.js';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1.js';

export const SecDNSRemTypeXml = z.union([
  z.object({
    'secDNS:all': z.union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ]),
  }),
  z.object({
    'secDNS:dsData': z.array(SecDNSDsDataTypeXml).min(1),
  }),
  z.object({
    'secDNS:keyData': z.array(SecDNSKeyDataTypeXml).min(1),
  }),
]);

export type SecDNSRemTypeXml = z.infer<typeof SecDNSRemTypeXml>;
