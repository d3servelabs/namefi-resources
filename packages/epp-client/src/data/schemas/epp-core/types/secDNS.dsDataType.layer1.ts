/**
 * Layer-1 XML JSON schema for type secDNS:dsDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { SecDNSKeyDataTypeXml } from './secDNS.keyDataType.layer1.js';

export const SecDNSDsDataTypeXml = zloosen(
  z.object({
    'secDNS:keyTag': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:alg': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:digestType': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:digest': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'secDNS:keyData': SecDNSKeyDataTypeXml.optional(),
  }),
);

export type SecDNSDsDataTypeXml = z.infer<typeof SecDNSDsDataTypeXml>;
