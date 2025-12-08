/**
 * Layer-1 XML JSON schema for type domain:hostAttrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const DomainHostAttrTypeXml = zloosen(
  z.object({
    'domain:hostName': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:hostAddr': z.array(HostAddrTypeXml).optional(),
  }),
);

export type DomainHostAttrTypeXml = z.infer<typeof DomainHostAttrTypeXml>;
