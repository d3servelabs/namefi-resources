/**
 * Layer-1 XML JSON schema for type secDNS:keyDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const SecDNSKeyDataTypeXml = zloosen(
  z.object({
    'secDNS:flags': zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    'secDNS:protocol': zloosen(
      z.object({ '#text': z.string().regex(/^-?\d+$/) }),
    ),
    'secDNS:alg': zloosen(z.object({ '#text': z.string().regex(/^-?\d+$/) })),
    'secDNS:pubKey': zloosen(z.object({ '#text': z.string().min(1) })),
  }),
);

export type SecDNSKeyDataTypeXml = z.infer<typeof SecDNSKeyDataTypeXml>;
