/**
 * Layer-1 XML JSON schema for type host:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostStatusTypeXml } from './host.statusType.layer1';
import { HostAddrTypeXml } from './host.addrType.layer1';

export const HostInfDataTypeXml = zloosen(
  z.object({
    'host:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'host:roid': zloosen(
      z.object({ '#text': z.string().regex(/(\w|_){1,80}-\w{1,8}/) }),
    ),
    'host:status': z.array(HostStatusTypeXml).min(1),
    'host:addr': z.array(HostAddrTypeXml).optional(),
    'host:clID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'host:crID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'host:crDate': zloosen(z.object({ '#text': z.string() })),
    'host:upID': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'host:upDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'host:trDate': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type HostInfDataTypeXml = z.infer<typeof HostInfDataTypeXml>;
