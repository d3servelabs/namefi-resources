/**
 * Layer-1 XML JSON schema for type secDNS:dsOrKeyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SecDNSDsDataTypeXml } from './secDNS.dsDataType.layer1';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1';

const _base0 = z.object({
  'secDNS:maxSigLife': zloosen(
    z.object({ '#text': z.string().regex(/^-?\d+$/) }),
  ).optional(),
});

export const SecDNSDsOrKeyTypeXml = z.union([
  zloosen(
    z.object({
      ..._base0.shape,
      'secDNS:dsData': z.array(SecDNSDsDataTypeXml).min(1),
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'secDNS:keyData': z.array(SecDNSKeyDataTypeXml).min(1),
    }),
  ),
]);

export type SecDNSDsOrKeyTypeXml = z.infer<typeof SecDNSDsOrKeyTypeXml>;
