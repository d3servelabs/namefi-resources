/**
 * Layer-1 XML JSON schema for type contact:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ContactAddrTypeXml = zloosen(
  z.object({
    'contact:street': z
      .array(zloosen(z.object({ '#text': z.string().max(255) })))
      .optional(),
    'contact:city': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'contact:sp': zloosen(
      z.object({ '#text': z.string().max(255) }),
    ).optional(),
    'contact:pc': zloosen(z.object({ '#text': z.string().max(16) })).optional(),
    'contact:cc': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type ContactAddrTypeXml = z.infer<typeof ContactAddrTypeXml>;
