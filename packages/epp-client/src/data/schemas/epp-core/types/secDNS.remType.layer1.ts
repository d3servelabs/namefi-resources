/**
 * Layer-1 XML JSON schema for type secDNS:remType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SecDNSDsDataTypeXml } from './secDNS.dsDataType.layer1';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1';

export const SecDNSRemTypeXml = z.union([
  zloosen(
    z.object({
      'secDNS:all': zloosen(
        z.object({
          '#text': z.union([
            z.literal('true'),
            z.literal('false'),
            z.literal('1'),
            z.literal('0'),
          ]),
        }),
      ),
    }),
  ),
  zloosen(
    z.object({
      'secDNS:dsData': z.array(SecDNSDsDataTypeXml).min(1),
    }),
  ),
  zloosen(
    z.object({
      'secDNS:keyData': z.array(SecDNSKeyDataTypeXml).min(1),
    }),
  ),
]);

export type SecDNSRemTypeXml = z.infer<typeof SecDNSRemTypeXml>;
