/**
 * Layer-1 XML JSON schema for type host:addRemType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostAddrTypeXml } from './host.addrType.layer1.js';
import { HostStatusTypeXml } from './host.statusType.layer1.js';

export const HostAddRemTypeXml = zloosen(
  z.object({
    'host:addr': z.array(HostAddrTypeXml).optional(),
    'host:status': z.array(HostStatusTypeXml).optional(),
  }),
);

export type HostAddRemTypeXml = z.infer<typeof HostAddRemTypeXml>;
