/**
 * Layer-1 XML JSON schema for type host:mNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const HostMNameTypeXml = zloosen(
  z.object({
    'host:name': z
      .array(
        z.union([
          z.string().min(1).max(255),
          zloosen(z.object({ '#text': z.string().min(1).max(255) })),
        ]),
      )
      .min(1),
  }),
);

export type HostMNameTypeXml = z.infer<typeof HostMNameTypeXml>;
