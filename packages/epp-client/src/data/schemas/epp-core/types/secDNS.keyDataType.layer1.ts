/**
 * Layer-1 XML JSON schema for type secDNS:keyDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const SecDNSKeyDataTypeXml = zloosen(
  z.object({
    'secDNS:flags': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:protocol': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:alg': z.union([
      z.string().regex(/^-?\d+$/),
      zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    ]),
    'secDNS:pubKey': z.union([
      z.string().min(1),
      zloosen(z.object({ '#text': z.string().min(1) })),
    ]),
  }),
);

export type SecDNSKeyDataTypeXml = z.infer<typeof SecDNSKeyDataTypeXml>;
