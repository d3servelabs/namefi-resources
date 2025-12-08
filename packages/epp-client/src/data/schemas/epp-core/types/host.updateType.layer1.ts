/**
 * Layer-1 XML JSON schema for type host:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostAddRemTypeXml } from './host.addRemType.layer1.js';
import { HostChgTypeXml } from './host.chgType.layer1.js';

export const HostUpdateTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
  'host:add': HostAddRemTypeXml.optional(),
  'host:rem': HostAddRemTypeXml.optional(),
  'host:chg': HostChgTypeXml.optional(),
});

export type HostUpdateTypeXml = z.infer<typeof HostUpdateTypeXml>;
