/**
 * Layer-1 XML JSON schema for type contact:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ContactAddrTypeXml = zloosen(
  z.object({
    'contact:street': z
      .array(
        z.union([
          z.string().max(255),
          zloosen(z.object({ '#text': z.string().max(255) })),
        ]),
      )
      .optional(),
    'contact:city': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'contact:sp': z
      .union([
        z.string().max(255),
        zloosen(z.object({ '#text': z.string().max(255) })),
      ])
      .optional(),
    'contact:pc': z
      .union([
        z.string().max(16),
        zloosen(z.object({ '#text': z.string().max(16) })),
      ])
      .optional(),
    'contact:cc': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type ContactAddrTypeXml = z.infer<typeof ContactAddrTypeXml>;
