/**
 * Layer-1 XML JSON schema for type host:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const HostCreateTypeXml = zloosen(
  z.object({
    'host:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'host:addr': z.array(HostAddrTypeXml).optional(),
  }),
);

export type HostCreateTypeXml = z.infer<typeof HostCreateTypeXml>;
