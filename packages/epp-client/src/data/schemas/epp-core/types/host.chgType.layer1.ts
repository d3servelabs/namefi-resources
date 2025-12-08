/**
 * Layer-1 XML JSON schema for type host:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const HostChgTypeXml = zloosen(
  z.object({
    'host:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
  }),
);

export type HostChgTypeXml = z.infer<typeof HostChgTypeXml>;
