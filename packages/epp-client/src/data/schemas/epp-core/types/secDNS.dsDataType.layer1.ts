/**
 * Layer-1 XML JSON schema for type secDNS:dsDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1';

export const SecDNSDsDataTypeXml = zloosen(
  z.object({
    'secDNS:keyTag': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ),
    'secDNS:alg': zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    'secDNS:digestType': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ),
    'secDNS:digest': zloosen(z.object({ '#text': z.string() })),
    'secDNS:keyData': SecDNSKeyDataTypeXml.optional(),
  }),
);

export type SecDNSDsDataTypeXml = z.infer<typeof SecDNSDsDataTypeXml>;
