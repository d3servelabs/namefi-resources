/**
 * Layer-1 XML JSON schema for type domain:hostAttrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const DomainHostAttrTypeXml = z.object({
  'domain:hostName': z.string().min(1).max(255),
  'domain:hostAddr': z.array(HostAddrTypeXml).optional(),
});

export type DomainHostAttrTypeXml = z.infer<typeof DomainHostAttrTypeXml>;
