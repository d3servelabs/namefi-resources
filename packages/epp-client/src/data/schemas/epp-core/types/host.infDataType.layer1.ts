/**
 * Layer-1 XML JSON schema for type host:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostStatusTypeXml } from './host.statusType.layer1.js';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const HostInfDataTypeXml = zloosen(
  z.object({
    'host:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'host:roid': z.union([
      z.string().regex(/(\w|_){1,80}-\w{1,8}/),
      zloosen(z.object({ '#text': z.string().regex(/(\w|_){1,80}-\w{1,8}/) })),
    ]),
    'host:status': z.array(HostStatusTypeXml).min(1),
    'host:addr': z.array(HostAddrTypeXml).optional(),
    'host:clID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'host:crID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'host:crDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'host:upID': z
      .union([
        z.string().min(3).max(64),
        zloosen(z.object({ '#text': z.string().min(3).max(64) })),
      ])
      .optional(),
    'host:upDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'host:trDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type HostInfDataTypeXml = z.infer<typeof HostInfDataTypeXml>;
