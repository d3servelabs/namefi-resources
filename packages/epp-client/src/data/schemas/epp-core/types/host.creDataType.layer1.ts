/**
 * Layer-1 XML JSON schema for type host:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const HostCreDataTypeXml = zloosen(
  z.object({
    'host:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'host:crDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type HostCreDataTypeXml = z.infer<typeof HostCreDataTypeXml>;
