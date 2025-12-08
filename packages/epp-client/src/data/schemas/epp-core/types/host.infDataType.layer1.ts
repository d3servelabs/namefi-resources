/**
 * Layer-1 XML JSON schema for type host:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostStatusTypeXml } from './host.statusType.layer1.js';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const HostInfDataTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
  'host:roid': z.string().regex(/(\w|_){1,80}-\w{1,8}/),
  'host:status': z.array(HostStatusTypeXml).min(1),
  'host:addr': z.array(HostAddrTypeXml).optional(),
  'host:clID': z.string().min(3).max(64),
  'host:crID': z.string().min(3).max(64),
  'host:crDate': z.string(),
  'host:upID': z.string().min(3).max(64).optional(),
  'host:upDate': z.string().optional(),
  'host:trDate': z.string().optional(),
});

export type HostInfDataTypeXml = z.infer<typeof HostInfDataTypeXml>;
